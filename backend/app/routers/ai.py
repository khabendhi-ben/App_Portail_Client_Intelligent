from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import httpx # Nécessaire pour faire des appels HTTP asynchrones vers Mistral

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
    return conversation.messages

# 2. Endpoint principal de discussion
@router.post("/chat", response_model=ai_schema.AIChatResponse)
async def chat_with_assistant(
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

    # B. Récupérer les données réelles du Client en base pour le contexte
    announcements = db.query(user_model.Announcement).filter(
        user_model.Announcement.user_id == current_user.id
    ).all()
    claims = db.query(user_model.Claim).filter(
        user_model.Claim.user_id == current_user.id
    ).all()

    # Formater les données du client sous forme textuelle
    annonces_txt = "\n".join([
        f"- Titre: {a.title}, Support: {a.support}, Statut: {a.status}, Budget: {a.budget or 0} DH, Réf: {a.reference}"
        for a in announcements
    ]) if announcements else "Aucune annonce active."

    claims_txt = "\n".join([
        f"- Sujet: {c.subject}, Priorité: {c.priority}, Statut: {c.status}, Réf: {c.reference}"
        for c in claims
    ]) if claims else "Aucune réclamation en cours."

    # C. Construire le Prompt Système (Le Contexte d'entreprise)
    prompt_base = ai_crud.get_llm_config(db, "llm_system_prompt")
    # Définition hors de l'f-string pour éviter le problème de syntaxe d'antislash (\)
    base_instructions = prompt_base if prompt_base else "Tu es l'assistant marketing officiel du Groupe Le Matin."
    
    prompt_system = (
        f"{base_instructions}\n\n"
        f"Tu discutes avec le client {current_user.nom} (Entreprise: {current_user.client_profile.company_name if current_user.client_profile else 'N/A'}).\n"
        f"Voici ses données actuelles extraites en temps réel de notre base de données :\n"
        f"=== SES ANNONCES ===\n{annonces_txt}\n\n"
        f"=== SES RÉCLAMATIONS ===\n{claims_txt}\n\n"
        f"Consignes importantes :\n"
        f"1. Si le message de l'utilisateur est une simple salutation (ex: 'Bonjour', 'Salut', 'Hey', etc.), réponds de manière brève, chaleureuse et professionnelle (ex: 'Bonjour ! Comment puis-je vous aider aujourd\'hui avec vos annonces ou vos réclamations sur le Portail Le Matin ?'). NE liste et NE détaille PAS ses annonces ou réclamations immédiatement.\n"
        f"2. N'utilise et ne détaille ces données que si l'utilisateur pose une question spécifique sur ses annonces, ses réclamations ou ses commandes.\n"
        f"3. Si la question sort du cadre de la gestion de ses annonces, réclamations ou du Portail Le Matin, réponds poliment que tu es un assistant spécialisé dans la gestion de ses données du Portail Le Matin."
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
                raise HTTPException(status_code=502, detail="Erreur de communication avec le modèle Mistral d'entreprise")
            
            result = response.json()
            ai_reply = result["choices"][0]["message"]["content"]
    except Exception as e:
        # En cas de problème réseau avec Mistral, on renvoie une réponse sécurisée
        ai_reply = "Je rencontre actuellement des difficultés pour joindre le serveur d'intelligence artificielle. Veuillez réessayer dans quelques instants."

    # G. Enregistrer la réponse de l'IA en BDD
    ai_crud.create_message(db, conv_id, sender="assistant", content=ai_reply)

    return ai_schema.AIChatResponse(response=ai_reply, conversation_id=conv_id)

async def stream_generator(api_url, payload, headers, db, conv_id, user_message):
    """Générateur asynchrone pour lire le flux du LLM et l'envoyer au client, puis l'enregistrer en BDD"""
    # Enregistrer le message de l'utilisateur immédiatement en BDD
    ai_crud.create_message(db, conv_id, sender="user", content=user_message)
    
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
    except Exception as e:
        yield "Désolé, je rencontre des difficultés techniques pour joindre le serveur d'intelligence artificielle."
    finally:
        # Une fois le streaming terminé avec succès, enregistrer la réponse complète de l'IA en BDD
        if accumulated_content:
            complete_response = "".join(accumulated_content)
            ai_crud.create_message(db, conv_id, sender="assistant", content=complete_response)

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

    # B. Récupérer les données réelles du Client en base pour le contexte
    announcements = db.query(user_model.Announcement).filter(
        user_model.Announcement.user_id == current_user.id
    ).all()
    claims = db.query(user_model.Claim).filter(
        user_model.Claim.user_id == current_user.id
    ).all()

    # Formater les données du client sous forme textuelle
    annonces_txt = "\n".join([
        f"- Titre: {a.title}, Support: {a.support}, Statut: {a.status}, Budget: {a.budget or 0} DH, Réf: {a.reference}"
        for a in announcements
    ]) if announcements else "Aucune annonce active."

    claims_txt = "\n".join([
        f"- Sujet: {c.subject}, Priorité: {c.priority}, Statut: {c.status}, Réf: {c.reference}"
        for c in claims
    ]) if claims else "Aucune réclamation en cours."

    # C. Construire le Prompt Système (Le Contexte d'entreprise + FAQ)
    prompt_base = ai_crud.get_llm_config(db, "llm_system_prompt")
    base_instructions = prompt_base if prompt_base else "Tu es l'assistant exclusif du portail client Groupe Le Matin."
    
    prompt_system = (
        f"{base_instructions}\n\n"
        f"--- BASE DE CONNAISSANCES (FAQ DU GROUPE LE MATIN) ---\n"
        f"- Déposer une réclamation : Rubrique 'Réclamations' du menu latéral.\n"
        f"- Délai de traitement : Le support technique traite les réclamations en 48h ouvrables.\n"
        f"- Modifier ou annuler une annonce : Une fois soumise et payée, impossible à modifier. Contacter le support.\n"
        f"- Changer de mot de passe : Section 'Gérer mon profil'.\n\n"
        f"--- DONNÉES DU CLIENT CONNECTÉ ---\n"
        f"Tu discutes avec le client : {current_user.nom}.\n"
        f"Voici ses données extraites en temps réel :\n"
        f"=== SES ANNONCES ===\n{annonces_txt}\n\n"
        f"=== SES RÉCLAMATIONS ===\n{claims_txt}\n\n"
        f"CONSIGNES IMPORTANTES :\n"
        f"1. Réponds DIRECTEMENT à la question du client. Si le client demande le statut de son annonce ou réclamation, donne-lui la réponse exacte qui est écrite ci-dessus.\n"
        f"2. NE RÉPÈTE PAS 'Bonjour' à chaque phrase. Agis comme un humain dans une conversation normale.\n"
        f"3. Si tu n'as pas l'information dans les données ci-dessus, dis simplement que tu ne sais pas."
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
        # Prendre les 6 derniers messages pour avoir le contexte sans surcharger
        for m in conversation.messages[-6:]:
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
        stream_generator(api_url, payload, headers, db, conv_id, request_data.message),
        media_type="text/event-stream",
        headers={"X-Conversation-Id": str(conv_id)}
    )