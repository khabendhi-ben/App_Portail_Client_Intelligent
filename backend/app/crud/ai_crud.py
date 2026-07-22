from sqlalchemy.orm import Session
import app.models.user_model as user_model

from app.core.crypto import encrypt_value, decrypt_value

def get_llm_config(db: Session, key_name: str) -> str:
    """Récupère une valeur de configuration (ex: clé API, modèle)"""
    config = db.query(user_model.ConfigurationLLM).filter(
        user_model.ConfigurationLLM.key_name == key_name
    ).first()
    if not config:
        return None
    # On déchiffre la clé API
    if key_name == "llm_api_key":
        return decrypt_value(config.value)
    return config.value

def update_llm_config(db: Session, key_name: str, value: str):
    """Met à jour ou insère une valeur de configuration"""
    # On chiffre la clé API avant stockage
    value_to_store = encrypt_value(value) if key_name == "llm_api_key" else value

    config = db.query(user_model.ConfigurationLLM).filter(
        user_model.ConfigurationLLM.key_name == key_name
    ).first()
    
    if config:
        config.value = value_to_store
    else:
        config = user_model.ConfigurationLLM(key_name=key_name, value=value_to_store)
        db.add(config)
    db.commit()
    db.refresh(config)
    return config

def get_user_conversations(db: Session, user_id: int):
    """Récupère toutes les conversations d'un client ordonnées par date"""
    return db.query(user_model.AIConversation).filter(
        user_model.AIConversation.user_id == user_id,
        user_model.AIConversation.is_deleted_by_client == False
    ).order_by(user_model.AIConversation.started_at.desc()).all()

def get_conversation(db: Session, conversation_id: int):
    """Récupère une conversation par son ID"""
    return db.query(user_model.AIConversation).filter(
        user_model.AIConversation.id == conversation_id
    ).first()

def create_conversation(db: Session, user_id: int):
    """Crée une nouvelle session de chat pour l'utilisateur"""
    db_conv = user_model.AIConversation(user_id=user_id)
    db.add(db_conv)
    db.commit()
    db.refresh(db_conv)
    return db_conv

def create_message(db: Session, conversation_id: int, sender: str, content: str, intent: str = None, response_time_ms: int = None):
    """Enregistre un message (de l'utilisateur ou de l'IA) en BDD"""
    db_msg = user_model.AIMessage(
        conversation_id=conversation_id,
        sender=sender,
        content=content,
        intent=intent,
        response_time_ms=response_time_ms
    )
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return db_msg

def get_admin_conversations(db: Session, client_search: str = None, start_date = None, end_date = None):
    """Récupère toutes les conversations des clients pour l'administration avec filtres et jointures optimisées"""
    from sqlalchemy.orm import joinedload
    from sqlalchemy import or_
    
    query = db.query(user_model.AIConversation).options(
        joinedload(user_model.AIConversation.user).joinedload(user_model.User.client_profile),
        joinedload(user_model.AIConversation.messages)
    )
    
    # Si on cherche par client (recherche textuelle sur nom, email, entreprise)
    if client_search:
        query = query.join(user_model.User).outerjoin(user_model.Client).filter(
            or_(
                user_model.User.nom.ilike(f"%{client_search}%"),
                user_model.User.email.ilike(f"%{client_search}%"),
                user_model.Client.company_name.ilike(f"%{client_search}%")
            )
        )
        
    if start_date:
        query = query.filter(user_model.AIConversation.started_at >= start_date)
    if end_date:
        query = query.filter(user_model.AIConversation.started_at <= end_date)
        
    return query.order_by(user_model.AIConversation.started_at.desc()).all()