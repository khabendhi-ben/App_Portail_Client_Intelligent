from sqlalchemy.orm import Session
import app.models.user_model as user_model, app.schemas.user_schema as user_schema, app.core.security as security

def get_user(db: Session, user_id: int):
    """Cherche un utilisateur par son ID"""
    return db.query(user_model.User).filter(user_model.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    """Cherche un utilisateur par son Email"""
    return db.query(user_model.User).filter(user_model.User.email == email).first()

def create_user(db: Session, user: user_schema.UserCreate):
    """Crée un nouvel utilisateur avec mot de passe haché"""
    hashed_pwd = security.get_password_hash(user.password)
    db_user = user_model.User(
        email=user.email,
        hashed_password=hashed_pwd,
        role=user.role
    )
    db.add(db_user)
    db.commit()
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
