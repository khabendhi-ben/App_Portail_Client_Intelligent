from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import httpx # Nécessaire pour faire des appels HTTP asynchrones vers Mistral
import app.crud.user_crud as user_crud

import app.models.user_model as user_model
import app.schemas.ai_schema as ai_schema
import app.crud.ai_crud as ai_crud
import app.core.database as database
import app.core.security as security

router = APIRouter(prefix="/ai", tags=["Assistant IA Chatbot"])

# 1. Endpoint pour récupérer l'historique des discussions du client connecté
@router.get("/conversations", response_model=List[ai_schema.AIConversationResponse])
def read_conversations(
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([user_model.UserRole.CLIENT])
    )
):
    return ai_crud.get_user_conversations(db, current_user.id)

# 1D. Endpoint pour masquer (soft delete) une conversation côté client
@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([user_model.UserRole.CLIENT])
    )
):
    conversation = ai_crud.get_conversation(db, conversation_id)
    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation introuvable")
    
    # Soft delete : masqué pour le client, conservé pour l'admin
    conversation.is_deleted_by_client = True
    db.commit()
    return {"message": "Conversation masquée avec succès"}

# 1B. Endpoints de supervision pour l'administration (réservés au rôle ADMIN)
@router.get("/admin/conversations", response_model=List[ai_schema.AIAdminConversationResponse])
def read_admin_conversations(
    client_search: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([user_model.UserRole.ADMIN])
    )
):
    conversations = ai_crud.get_admin_conversations(db, client_search, start_date, end_date)
    response_data = []
    for conv in conversations:
        response_data.append(ai_schema.AIAdminConversationResponse(
            id=conv.id,
            started_at=conv.started_at,
            nom_client=conv.user.nom if conv.user else None,
            email_client=conv.user.email if conv.user else "N/A",
            entreprise_client=conv.user.client_profile.company_name if (conv.user and conv.user.client_profile) else None,
            message_count=len(conv.messages)
        ))
    return response_data

@router.get("/admin/conversations/{conversation_id}/messages", response_model=List[ai_schema.AIMessageResponse])
def read_admin_conversation_messages(
    conversation_id: int,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([user_model.UserRole.ADMIN])
    )
):
    conversation = ai_crud.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation introuvable")
    
    # Retourner les messages triés par ID (ordre chronologique d'insertion)
    return db.query(user_model.AIMessage).filter(
        user_model.AIMessage.conversation_id == conversation_id
    ).order_by(user_model.AIMessage.id.asc()).all()

# 1C. Configuration LLM (Réservé au SuperAdmin)
@router.get("/superadmin/config", response_model=ai_schema.LLMConfigResponse)
def get_llm_config_admin(
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([user_model.UserRole.SUPERADMIN])
    )
):
    return ai_schema.LLMConfigResponse(
        llm_endpoint=ai_crud.get_llm_config(db, "llm_endpoint") or "",
        llm_api_key=ai_crud.get_llm_config(db, "llm_api_key") or "",
        llm_model=ai_crud.get_llm_config(db, "llm_model") or "",
        llm_system_prompt=ai_crud.get_llm_config(db, "llm_system_prompt") or ""
    )

@router.put("/superadmin/config")
def update_llm_config_admin(
    config: ai_schema.LLMConfigUpdate,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([user_model.UserRole.SUPERADMIN])
    )
):
    ai_crud.update_llm_config(db, "llm_endpoint", config.llm_endpoint)
    ai_crud.update_llm_config(db, "llm_api_key", config.llm_api_key)
    ai_crud.update_llm_config(db, "llm_model", config.llm_model)
    ai_crud.update_llm_config(db, "llm_system_prompt", config.llm_system_prompt)
    
    # Log de l'action sensible
    user_crud.log_action(
        db=db, action="CONFIG_LLM_UPDATE",
        user_id=current_user.id,
        details="Le SuperAdmin a mis à jour la configuration du modèle LLM.",
        ip_address="0.0.0.0"
    )
    return {"status": "success", "message": "Configuration LLM mise à jour"}

@router.post("/superadmin/test-config")
async def test_llm_config(
    config: ai_schema.LLMConfigUpdate,
    current_user: user_model.User = Depends(
        security.require_roles([user_model.UserRole.SUPERADMIN])
    )
):
    headers = {
        "Authorization": f"Bearer {config.llm_api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": config.llm_model,
        "messages": [
            {"role": "system", "content": config.llm_system_prompt},
            {"role": "user", "content": "Ceci est un test de connexion. Réponds simplement 'OK'."}
        ],
        "max_tokens": 10,
        "temperature": 0.3
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(config.llm_endpoint, json=payload, headers=headers, timeout=10.0)
            if response.status_code == 200:
                return {"status": "success", "message": "Connexion LLM réussie !"}
            else:
                raise HTTPException(status_code=400, detail=f"Erreur API ({response.status_code}): {response.text}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur de connexion: {str(e)}")

# --- Fonctions utilitaires d'Orchestration IA ---

def detect_intent(message: str, last_message_content: str = "") -> str:
    """Détecte l'intention de l'utilisateur pour adapter le contexte."""
    user_msg_lower = message.lower()
    
    if any(word in user_msg_lower for word in ["bonjour", "salut", "coucou", "hey", "hello", "bonsoir", "merci", "au revoir", "bye"]):
        if len(user_msg_lower.split()) < 5:
            return "GREETING"
            
    if any(word in user_msg_lower for word in ["réclamation", "reclamation", "problème", "probleme", "panne", "ticket", "remboursement", "lent", "statut", "état", "etat", "première", "deuxième"]):
        return "CLAIM"
        
    if any(word in user_msg_lower for word in ["annonce", "publication", "budget", "modifier", "pub", "campagne", "sponsoring"]):
        return "ANNOUNCEMENT"
        
    # Fallback historique
    if last_message_content:
        last_msg = last_message_content.lower()
        if "réclamation" in last_msg or "reclamation" in last_msg:
            return "CLAIM"
        if "annonce" in last_msg or "campagne" in last_msg:
            return "ANNOUNCEMENT"
            
    return "OTHER"

def build_context(intent: str, current_user: user_model.User, db: Session) -> str:
    """Construit le contexte métier injecté dans le prompt."""
    if intent == "GREETING":
        return "RÈGLE SPÉCIALE: C'est une simple salutation ou remerciement. Réponds chaleureusement en invitant le client à poser ses questions sur le portail, sans lister aucune donnée métier."
        
    context_parts = []
    
    if intent in ["ANNOUNCEMENT", "ALL", "OTHER"]:
        announcements = db.query(user_model.Announcement).filter(
            user_model.Announcement.user_id == current_user.id
        ).all()
        annonces_txt = "\n".join([
            f"- Réf: {a.reference}, Support: {a.support}, Type: {a.type}, Statut: {a.status}, Budget: {a.budget or 0} DH"
            for a in announcements
        ]) if announcements else "Vous n'avez aucune annonce."
        context_parts.append(f"Voici ses annonces:\n{annonces_txt}\n")

    if intent in ["CLAIM", "ALL", "OTHER"]:
        claims = db.query(user_model.Claim).filter(
            user_model.Claim.user_id == current_user.id
        ).all()
        claims_txt = "\n".join([
            f"- Sujet: {c.subject}, Priorité: {c.priority}, Statut: {c.status}, Réf: {c.reference}"
            for c in claims
        ]) if claims else "Vous n'avez aucune réclamation."
        context_parts.append(f"Voici ses réclamations UNIQUEMENT:\n{claims_txt}\n")
        
    if intent == "OTHER":
        context_parts.append("RÈGLE SPÉCIALE: La question semble ambiguë, hors domaine, ou concerne une entité non gérée (profil, adresses). Demande des précisions ou refuse poliment.")

    return "\n".join(context_parts)

# 2. Endpoint principal de discussion
@router.post("/chat", response_model=ai_schema.AIChatResponse)
async def chat_with_assistant(
    request_data: ai_schema.AIChatRequest,
    request: Request,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([user_model.UserRole.CLIENT])
    )
):
    # A. Gérer la conversation (nouvelle ou existante)
    conv_id = request_data.conversation_id
    if not conv_id:
        conversation = ai_crud.create_conversation(db, current_user.id)
        conv_id = conversation.id
    else:
        conversation = ai_crud.get_conversation(db, conv_id)
        if not conversation or conversation.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Conversation introuvable")

    # B. Récupérer les données réelles du Client en base pour le contexte
    announcements = db.query(user_model.Announcement).filter(
        user_model.Announcement.user_id == current_user.id
    ).all()
    claims = db.query(user_model.Claim).filter(
        user_model.Claim.user_id == current_user.id
    ).all()

    # Formater les données du client sous forme textuelle
    annonces_txt = "\n".join([
        f"- Réf: {a.reference}, Support: {a.support}, Type: {a.type}, Statut: {a.status}, Budget: {a.budget or 0} DH"
        for a in announcements
    ]) if announcements else "Aucune annonce active."

    claims_txt = "\n".join([
        f"- Sujet: {c.subject}, Priorité: {c.priority}, Statut: {c.status}, Réf: {c.reference}"
        for c in claims
    ]) if claims else "Aucune réclamation en cours."

    # C. Construire le Prompt Système (Le Contexte d'entreprise)
    prompt_base = ai_crud.get_llm_config(db, "llm_system_prompt")
    
    default_prompt = (
        "Tu es l'assistant marketing officiel du Groupe Le Matin.\n"
        "Consignes importantes :\n"
        "1. Si le message de l'utilisateur est une simple salutation (ex: 'Bonjour', 'Salut', 'Hey', etc.), réponds de manière brève, chaleureuse et professionnelle (ex: 'Bonjour ! Comment puis-je vous aider aujourd'hui avec vos annonces ou vos réclamations sur le Portail Le Matin ?'). NE liste et NE détaille PAS ses annonces ou réclamations immédiatement.\n"
        "2. N'utilise et ne détaille ces données que si l'utilisateur pose une question spécifique sur ses annonces, ses réclamations ou ses commandes.\n"
        "3. Si la question sort du cadre de la gestion de ses annonces, réclamations ou du Portail Le Matin, réponds poliment que tu es un assistant spécialisé dans la gestion de ses données du Portail Le Matin."
    )
    
    base_instructions = prompt_base if prompt_base else default_prompt
    user_phone = current_user.phone or (current_user.client_profile.phone if current_user.client_profile else None) or "Non renseigné"
    
    prompt_system = (
        f"{base_instructions}\n\n"
        f"Tu discutes avec le client suivant :\n"
        f"- Nom : {current_user.nom or 'Non renseigné'}\n"
        f"- Email : {current_user.email}\n"
        f"- Téléphone : {user_phone}\n"
        f"- Entreprise : {current_user.client_profile.company_name if current_user.client_profile else 'N/A'}\n\n"
        f"Voici ses données actuelles extraites en temps réel de notre base de données :\n"
        f"=== SES ANNONCES ===\n{annonces_txt}\n\n"
        f"=== SES RÉCLAMATIONS ===\n{claims_txt}\n"
    )

    # D. Enregistrer la question de l'utilisateur en BDD
    ai_crud.create_message(db, conv_id, sender="user", content=request_data.message)

    # E. Récupérer les configurations du modèle Mistral depuis la table CONFIGURATION_LLM
    api_url = ai_crud.get_llm_config(db, "llm_endpoint") or "https://api.mistral.ai/v1/chat/completions"
    api_key = ai_crud.get_llm_config(db, "llm_api_key") or "METTRE_VOTRE_CLE_MISTRAL_DE_BASE"
    model_name = ai_crud.get_llm_config(db, "llm_model") or "mistral-large-latest"

    # F. Envoyer la requête au serveur Mistral de l'entreprise (Payload JSON)
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": prompt_system},
            {"role": "user", "content": request_data.message}
        ],
        "max_tokens": 1024,
        "temperature": 0.3
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(api_url, json=payload, headers=headers, timeout=30.0)
            
            if response.status_code != 200:
                user_crud.log_action(
                    db=db, action="ERREUR_LLM",
                    user_id=current_user.id,
                    details=f"Erreur Mistral (HTTP {response.status_code}) pour {current_user.email}",
                    ip_address=request.client.host if request.client else "inconnu",
                    severity="ERROR"
                )
                raise HTTPException(status_code=502, detail="Erreur de communication avec le modèle Mistral d'entreprise")
            
            result = response.json()
            ai_reply = result["choices"][0]["message"]["content"]
    except HTTPException:
        raise
    except Exception as e:
        # En cas de problème réseau avec Mistral
        user_crud.log_action(
            db=db, action="ERREUR_LLM",
            user_id=current_user.id,
            details=f"Exception LLM pour {current_user.email} : {str(e)[:120]}",
            ip_address=request.client.host if request.client else "inconnu",
            severity="ERROR"
        )
        ai_reply = "Je rencontre actuellement des difficultés pour joindre le serveur d'intelligence artificielle. Veuillez réessayer dans quelques instants."

    # G. Enregistrer la réponse de l'IA en BDD
    ai_crud.create_message(db, conv_id, sender="assistant", content=ai_reply)

    # H. Log de l'appel LLM
    user_crud.log_action(
        db=db, action="APPEL_LLM",
        user_id=current_user.id,
        details=f"Message envoyé à l'IA par {current_user.email} (conv #{conv_id})",
        ip_address=request.client.host if request.client else "inconnu",
        severity="INFO"
    )

    return ai_schema.AIChatResponse(response=ai_reply, conversation_id=conv_id)

async def stream_generator(api_url, payload, headers, db, conv_id, user_message, intent):
    """Générateur asynchrone pour lire le flux du LLM et l'envoyer au client, puis l'enregistrer en BDD"""
    import time
    start_time = time.time()
    
    # Enregistrer le message de l'utilisateur immédiatement en BDD avec son intention
    ai_crud.create_message(db, conv_id, sender="user", content=user_message, intent=intent)
    
    accumulated_content = []
    try:
        async with httpx.AsyncClient() as client:
            async with client.stream("POST", api_url, json=payload, headers=headers, timeout=30.0) as response:
                if response.status_code != 200:
                    yield "Désolé, je rencontre des difficultés pour me connecter au modèle d'entreprise."
                    return
                
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    if line.startswith("data: "):
                        data_content = line[6:].strip()
                        if data_content == "[DONE]":
                            break
                        try:
                            import json
                            chunk_data = json.loads(data_content)
                            delta = chunk_data.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                accumulated_content.append(content)
                                yield content
                        except Exception:
                            continue
                
                # Une fois la boucle Mistral terminée avec succès, on injecte les suggestions dynamiques
                import json
                suggestions = ["Mes annonces", "Mes réclamations", "Mon profil"]
                yield f"__SUGGESTIONS__{json.dumps(suggestions)}"
    except Exception as e:
        yield "Désolé, je rencontre des difficultés techniques pour joindre le serveur d'intelligence artificielle."
    finally:
        # Une fois le streaming terminé avec succès, enregistrer la réponse complète de l'IA en BDD
        response_time_ms = int((time.time() - start_time) * 1000)
        if accumulated_content:
            complete_response = "".join(accumulated_content)
            ai_crud.create_message(db, conv_id, sender="assistant", content=complete_response, intent=intent, response_time_ms=response_time_ms)

# 3. Endpoint principal de discussion en Streaming (Progressif)
@router.post("/chat/stream")
async def chat_with_assistant_stream(
    request_data: ai_schema.AIChatRequest,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([user_model.UserRole.CLIENT])
    )
):
    # A. Gérer la conversation (nouvelle ou existante)
    conv_id = request_data.conversation_id
    if not conv_id:
        conversation = ai_crud.create_conversation(db, current_user.id)
        conv_id = conversation.id
    else:
        conversation = ai_crud.get_conversation(db, conv_id)
        if not conversation or conversation.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Conversation introuvable")

    # B. Détection d'intention (Intent Routing)
    last_msg_content = ""
    if conversation and conversation.messages:
        last_msg_content = conversation.messages[-1].content
    intent = detect_intent(request_data.message, last_msg_content)

    # C. Récupération des données optimisée via Context Builder
    context_data = build_context(intent, current_user, db)

    # D. Construire le Prompt Système structuré (Prompt Engineering)
    prompt_base = ai_crud.get_llm_config(db, "llm_system_prompt")
    
    default_prompt = (
        "Tu es l'assistant officiel du portail client Groupe Le Matin.\n"
        "Consignes importantes :\n"
        "1. Répondre UNIQUEMENT aux questions liées au portail, aux annonces et aux réclamations.\n"
        "2. Si la question est hors domaine (ex: météo, recettes, président, commandes, factures, adresse), répondre STRICTEMENT: 'Je peux uniquement répondre aux questions concernant le portail client.'\n"
        "3. Si l'utilisateur demande des informations sur SES commandes ou profil et qu'elles ne sont pas dans le contexte fourni, réponds STRICTEMENT: 'Je ne dispose d'aucune information concernant vos commandes/profil.'\n"
        "4. CLOISONNEMENT: Si l'utilisateur demande des informations sur UNE AUTRE PERSONNE (Mohamed, Fatima, etc.), réponds STRICTEMENT: 'Je ne peux pas accéder aux informations d'un autre utilisateur.'\n"
        "5. Ne JAMAIS inventer des informations absentes du contexte.\n"
        "6. Si la question est ambiguë et que le contexte historique est insuffisant, demander une précision poliment.\n"
        "7. Si c'est une salutation ('Bonjour', 'Bonsoir', 'Salut'), réponds par une salutation polie, et demande comment tu peux l'aider concernant son espace client.\n"
        "8. Si c'est un remerciement ('Merci'), réponds 'Avec plaisir' ou similaire, et invite à poser d'autres questions."
    )
    
    base_instructions = prompt_base if prompt_base else default_prompt
    user_phone = current_user.phone or (current_user.client_profile.phone if current_user.client_profile else None) or "Non renseigné"
    
    prompt_system = (
        f"[ROLE & RÈGLES]\n"
        f"{base_instructions}\n\n"
        f"[CONTEXTE DU CLIENT]\n"
        f"- Nom : {current_user.nom or 'Non renseigné'}\n"
        f"- Email : {current_user.email}\n"
        f"- Téléphone : {user_phone}\n"
        f"- Entreprise : {current_user.client_profile.company_name if current_user.client_profile else 'N/A'}\n\n"
        f"[DONNÉES DU PORTAIL]\n"
        f"{context_data}\n"
    )

    # D. Récupérer les configurations du modèle Mistral depuis la table CONFIGURATION_LLM
    api_url = ai_crud.get_llm_config(db, "llm_endpoint") or "https://api.mistral.ai/v1/chat/completions"
    api_key = ai_crud.get_llm_config(db, "llm_api_key") or "METTRE_VOTRE_CLE_MISTRAL_DE_BASE"
    model_name = ai_crud.get_llm_config(db, "llm_model") or "mistral-large-latest"

    # E. Préparer les headers et le payload de streaming avec HISTORIQUE
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Construire l'historique de la conversation pour que l'IA ait de la mémoire
    messages_payload = [{"role": "system", "content": prompt_system}]
    if conversation and conversation.messages:
        # Prendre l'historique complet de la conversation
        for m in conversation.messages:
            if m.content:
                messages_payload.append({"role": m.sender, "content": m.content})
                
    # Ajouter la question actuelle de l'utilisateur
    messages_payload.append({"role": "user", "content": request_data.message})

    payload = {
        "model": model_name,
        "messages": messages_payload,
        "max_tokens": 1024,
        "temperature": 0.3,
        "stream": True # Activer le streaming !
    }

    return StreamingResponse(
        stream_generator(api_url, payload, headers, db, conv_id, request_data.message, intent),
        media_type="text/event-stream",
        headers={"X-Conversation-Id": str(conv_id)}
    )

# 4. Statistiques pour l'administration (SuperAdmin)
@router.get("/superadmin/stats", response_model=ai_schema.AIBoardStatsResponse)
def get_ai_stats(
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([user_model.UserRole.SUPERADMIN])
    )
):
    from sqlalchemy import func
    
    # 1. Total des requêtes (messages des utilisateurs)
    total_requests = db.query(user_model.AIMessage).filter(
        user_model.AIMessage.sender == "user"
    ).count()
    
    # 2. Temps de réponse moyen (messages de l'assistant)
    avg_response_time = db.query(func.avg(user_model.AIMessage.response_time_ms)).filter(
        user_model.AIMessage.sender == "assistant",
        user_model.AIMessage.response_time_ms != None
    ).scalar() or 0.0
    
    # 3. Répartition des intentions (sur les requêtes utilisateur)
    intent_counts = db.query(
        user_model.AIMessage.intent, 
        func.count(user_model.AIMessage.id)
    ).filter(
        user_model.AIMessage.sender == "user",
        user_model.AIMessage.intent != None
    ).group_by(user_model.AIMessage.intent).all()
    
    intent_distribution = [
        ai_schema.AIIntentStat(intent=row[0] or "UNKNOWN", count=row[1]) 
        for row in intent_counts
    ]
    
    return ai_schema.AIBoardStatsResponse(
        total_requests=total_requests,
        average_response_time_ms=float(avg_response_time),
        intent_distribution=intent_distribution
    )