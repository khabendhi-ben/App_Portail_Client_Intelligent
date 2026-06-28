# (Create, Read, Update, Delete). 
# C'est l'unique couche autorisée à 
# interagir avec la base de données. 
# Elle exécute les requêtes SQL abstraites.
        
        
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, date
from typing import Optional
import app.models.user_model as user_model, app.schemas.user_schema as user_schema, app.core.security as security

def get_user(db: Session, user_id: int):
    """Cherche un utilisateur par son ID"""
    return db.query(user_model.User).filter(user_model.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    """Cherche un utilisateur par son Email"""
    return db.query(user_model.User).filter(user_model.User.email == email).first()

def get_all_users(db: Session):
    return db.query(user_model.User).all()

def get_users_by_role(db: Session, role: str):
    """Récupère tous les utilisateurs d'un rôle donné"""
    mapping = {"superadmin": 0, "admin": 1, "client": 2}
    r_id = mapping.get(str(role).lower().split('.')[-1], 2)
    return db.query(user_model.User).filter(user_model.User.role_id == r_id).all()

def create_user(db: Session, user: user_schema.UserCreate, hashed_password: str):
    """Crée un nouvel utilisateur avec mot de passe haché"""
    db_user = user_model.User(
        nom=user.nom,
        email=user.email,
        phone=user.phone,
        hashed_password=hashed_password,
        role=user.role,
        must_change_password=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_reset_request(db: Session, email: str):
    """Crée une nouvelle demande de réinitialisation"""
    db_request = user_model.PasswordResetRequest(email=email)
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

def get_reset_requests(db: Session):
    """Récupère toutes les demandes en attente pour le SuperAdmin"""
    return db.query(user_model.PasswordResetRequest).filter(user_model.PasswordResetRequest.status == "en_attente").all()

def update_user_password(db: Session, email: str, new_password_hash: str):
    """Met à jour le mot de passe d'un utilisateur"""
    user = db.query(user_model.User).filter(user_model.User.email == email).first()
    if user:
        user.hashed_password = new_password_hash
        db.commit()
        return True
    return False

def mark_reset_request_done(db: Session, request_id: int):
    """Marque une demande comme traitée"""
    request = db.query(user_model.PasswordResetRequest).filter(user_model.PasswordResetRequest.id == request_id).first()
    if request:
        request.status = "traité"
        db.commit()
        
def delete_user(db: Session, user_id: int):
    """Supprime un utilisateur de la base de données avec nettoyage en cascade"""
    db_user = db.query(user_model.User).filter(user_model.User.id == user_id).first()
    if db_user:
        # 1. Supprimer le profil client si existant
        if db_user.client_profile:
            db.delete(db_user.client_profile)
            
        # 2. Supprimer les réclamations de l'utilisateur
        if db_user.claims:
            for claim in db_user.claims:
                db.delete(claim)
                
        # 3. Supprimer les annonces de l'utilisateur
        if db_user.announcements:
            for ann in db_user.announcements:
                db.delete(ann)
                
        # 4. Supprimer les conversations IA de l'utilisateur
        if db_user.ai_conversations:
            for conv in db_user.ai_conversations:
                # Supprimer les messages de la conversation d'abord
                for msg in conv.messages:
                    db.delete(msg)
                db.delete(conv)
                
        # 5. Supprimer les demandes de réinitialisation de mot de passe associées à cet email
        db.query(user_model.PasswordResetRequest).filter(
            user_model.PasswordResetRequest.email == db_user.email
        ).delete(synchronize_session=False)
        
        # 6. Dissocier les logs système (mettre user_id à None)
        db.query(user_model.SystemLog).filter(
            user_model.SystemLog.user_id == user_id
        ).update({user_model.SystemLog.user_id: None}, synchronize_session=False)

        # 7. Supprimer l'utilisateur
        db.delete(db_user)
        db.commit()
        return True
    return False

def deactivate_user(db: Session, user_id: int):
    """Désactive un utilisateur"""
    db_user = db.query(user_model.User).filter(user_model.User.id == user_id).first()
    if db_user:
        db_user.is_active = False
        db.commit()
        db.refresh(db_user)
        return db_user
    return None

def update_user(db: Session, user_id: int, user_data: user_schema.UserUpdate):
    """Met à jour les informations d'un utilisateur"""
    db_user = db.query(user_model.User).filter(user_model.User.id == user_id).first()
    if not db_user:
        return None

    update_dict = user_data.dict(exclude_unset=True)
    if "password" in update_dict:
        if update_dict["password"]:
            db_user.hashed_password = security.get_password_hash(update_dict["password"])
        del update_dict["password"]

    if "old_password" in update_dict:
        del update_dict["old_password"]

    if "address" in update_dict:
        address_val = update_dict["address"]
        if db_user.client_profile:
            db_user.client_profile.address = address_val
        del update_dict["address"]

    for key, value in update_dict.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user


# ─── CRUD CLIENTS ─────────────────────────────────────────────

def create_client_with_profile(db: Session, client_data: user_schema.ClientCreate, hashed_password: str):
    """Crée un utilisateur (rôle client) + son profil client en une seule opération"""
    # 1. Créer le User
    db_user = user_model.User(
        nom=client_data.nom,
        email=client_data.email,
        phone=client_data.phone,
        hashed_password=hashed_password,
        role=user_model.UserRole.CLIENT,
        must_change_password=True
    )
    db.add(db_user)
    db.flush()  # Pour obtenir l'ID avant le commit

    # 2. Créer le profil Client
    db_client = user_model.Client(
        user_id=db_user.id,
        company_name=client_data.company_name,
        phone=client_data.phone,
        address=client_data.address,
        subscription_type=client_data.subscription_type,
        budget=client_data.budget
    )
    db.add(db_client)
    db.commit()
    db.refresh(db_user)
    db.refresh(db_client)

    return db_user, db_client

def get_all_clients_with_profile(db: Session):
    """Récupère tous les clients avec leur profil"""
    clients = db.query(user_model.User).filter(
        user_model.User.role_id == 2
    ).all()
    return clients

def get_client_profile(db: Session, user_id: int):
    """Récupère le profil client associé à un user_id"""
    return db.query(user_model.Client).filter(user_model.Client.user_id == user_id).first()

def update_client_with_profile(db: Session, user_id: int, client_data: user_schema.ClientUpdate):
    """Met à jour un client (User + profil Client)"""
    db_user = db.query(user_model.User).filter(user_model.User.id == user_id).first()
    if not db_user:
        return None, None

    # Mise à jour du User
    update_dict = client_data.dict(exclude_unset=True)
    user_fields = ["nom", "email", "phone"]
    for field in user_fields:
        if field in update_dict:
            setattr(db_user, field, update_dict[field])

    # Mise à jour du profil Client
    db_client = db.query(user_model.Client).filter(user_model.Client.user_id == user_id).first()
    if db_client:
        client_fields = ["company_name", "address", "subscription_type", "budget"]
        for field in client_fields:
            if field in update_dict:
                setattr(db_client, field, update_dict[field])
        # Synchroniser le téléphone
        if "phone" in update_dict:
            db_client.phone = update_dict["phone"]

    db.commit()
    db.refresh(db_user)
    if db_client:
        db.refresh(db_client)

    return db_user, db_client


# ─── CRUD LOGS SYSTÈME ────────────────────────────────────────

def log_action(
    db: Session,
    action: str,
    user_id: Optional[int] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
    severity: str = "INFO"
):
    """
    Enregistre un événement dans les journaux système.
    - action : ex. 'CONNEXION_REUSSIE', 'ECHEC_CONNEXION', 'PROFIL_MAJ'
    - severity : 'INFO', 'WARNING', 'ERROR'
    - ip_address : adresse IP de la requête
    """
    log = user_model.SystemLog(
        action=action,
        user_id=user_id,
        details=details,
        ip_address=ip_address,
        severity=severity
    )
    db.add(log)
    db.commit()
    return log


def get_system_logs(
    db: Session,
    action_filter: Optional[str] = None,
    user_email_filter: Optional[str] = None,
    ip_filter: Optional[str] = None,
    severity_filter: Optional[str] = None,
    date_filter: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """
    Récupère les logs système avec des filtres optionnels.
    Trie par date décroissante (les plus récents en premier).
    """
    query = db.query(user_model.SystemLog)

    # Filtre par action (recherche partielle insensible à la casse)
    if action_filter:
        query = query.filter(user_model.SystemLog.action.ilike(f"%{action_filter}%"))

    # Filtre par criticité
    if severity_filter and severity_filter in ["INFO", "WARNING", "ERROR"]:
        query = query.filter(user_model.SystemLog.severity == severity_filter)

    # Filtre par adresse IP (recherche partielle)
    if ip_filter:
        query = query.filter(user_model.SystemLog.ip_address.ilike(f"%{ip_filter}%"))

    # Filtre par date (journée complète)
    if date_filter:
        try:
            target_date = datetime.strptime(date_filter, "%Y-%m-%d").date()
            query = query.filter(
                user_model.SystemLog.timestamp >= datetime.combine(target_date, datetime.min.time()),
                user_model.SystemLog.timestamp < datetime.combine(target_date, datetime.max.time())
            )
        except ValueError:
            pass

    # Filtre par email utilisateur (nécessite une jointure avec UTILISATEURS)
    if user_email_filter:
        query = query.join(
            user_model.User,
            user_model.SystemLog.user_id == user_model.User.id,
            isouter=True
        ).filter(user_model.User.email.ilike(f"%{user_email_filter}%"))

    logs = query.order_by(user_model.SystemLog.timestamp.desc()).offset(offset).limit(limit).all()
    return logs
