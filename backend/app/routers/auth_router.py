from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import JWTError, jwt

import app.models.user_model as user_model
import app.schemas.user_schema as user_schema
import app.crud.user_crud as user_crud
import app.core.security as security
import app.core.database as database

router = APIRouter(prefix="/auth", tags=["Authentification"])

@router.post("/login", response_model=user_schema.Token)
def login_for_access_token(
    request: Request,
    user_credentials: user_schema.UserLogin,
    db: Session = Depends(database.get_db)
):
    """Route pour se connecter et obtenir un Token JWT"""
    
    # 1. Vérifier si l'utilisateur existe
    user = user_crud.get_user_by_email(db, email=user_credentials.email)
    if not user:
        # Log d'un échec de connexion (email inconnu) - WARNING
        ip = request.client.host if request.client else "inconnu"
        user_crud.log_action(
            db=db, action="ECHEC_CONNEXION",
            details=f"Tentative avec email inconnu: {user_credentials.email}",
            ip_address=ip, severity="WARNING"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 2. Vérifier le mot de passe
    if not security.verify_password(user_credentials.password, user.hashed_password):
        # Log d'un échec de connexion (mauvais MDP) - WARNING
        ip = request.client.host if request.client else "inconnu"
        user_crud.log_action(
            db=db, action="ECHEC_CONNEXION",
            user_id=user.id,
            details=f"Mot de passe incorrect pour: {user.email}",
            ip_address=ip, severity="WARNING"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Vérifier si le compte est actif
    if not user.is_active:
        ip = request.client.host if request.client else "inconnu"
        user_crud.log_action(
            db=db, action="CONNEXION_COMPTE_BLOQUE",
            user_id=user.id,
            details=f"Tentative de connexion sur compte bloqué: {user.email}",
            ip_address=ip, severity="WARNING"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Votre compte a été désactivé. Veuillez contacter l'administrateur.",
        )
    
    # 3. Générer le Token JWT
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email, "role": user.role}, 
        expires_delta=access_token_expires
    )

    # Log de la connexion réussie - INFO
    ip = request.client.host if request.client else "inconnu"
    user_crud.log_action(
        db=db, action="CONNEXION_REUSSIE",
        user_id=user.id,
        details=f"Connexion réussie pour: {user.email}",
        ip_address=ip, severity="INFO"
    )

    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "must_change_password": user.must_change_password}


@router.post("/logout")
def logout(
    request: Request,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(security.get_current_user)
):
    """Déconnexion — enregistre un log DECONNEXION puis invalide la session côté client"""
    ip = request.client.host if request.client else "inconnu"
    user_crud.log_action(
        db=db,
        action="DECONNEXION",
        user_id=current_user.id,
        details=f"Déconnexion de : {current_user.email}",
        ip_address=ip,
        severity="INFO"
    )
    return {"message": "Déconnexion enregistrée avec succès"}



@router.post("/forgot-password")
def request_password_reset(
    data: user_schema.ForgotPasswordRequest,
    db: Session = Depends(database.get_db)
):
    """L'utilisateur demande une réinitialisation"""


    user = user_crud.get_user_by_email(db, email=data.email)

    if not user:
        # Sécurité : ne pas révéler que l'email n'existe pas
        return {"message": "Si cet email existe, une procédure de réinitialisation a été initiée."}

    # Création de la demande en base de données pour tout le monde
    user_crud.create_reset_request(db, email=data.email)

    # Si c'est un client : la demande est pour l'Admin
    if user.role_id == 2:
        return {
            "message": "Votre demande a été transmise à l'administrateur. Vous recevrez un email prochainement."
        }

    # Si c'est un Admin/SuperAdmin : demande transmise au SuperAdmin
    return {
        "message": "Votre demande a été transmise au SuperAdmin. Vous recevrez un email prochainement."
    }

@router.get("/admin/reset-requests")
def get_reset_requests(
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([
            user_model.UserRole.SUPERADMIN
        ])
    )
):
    """Récupère toutes les demandes de réinitialisation d'admins (role_id == 1) en attente"""
    requests = db.query(user_model.PasswordResetRequest)\
        .join(user_model.User, user_model.User.email == user_model.PasswordResetRequest.email)\
        .filter(user_model.User.role_id == 1)\
        .filter(user_model.PasswordResetRequest.status == "en_attente")\
        .all()
    return [
        {
            "id": r.id,
            "email": r.email,
            "status": r.status,
            "created_at": r.created_at
        }
        for r in requests
    ]

@router.post("/admin/reset-password")
def admin_reset_password(
    input_data: user_schema.AdminResetPasswordInput,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([
            user_model.UserRole.SUPERADMIN
        ])
    )
):
    """Le SuperAdmin réinitialise le mot de passe d'un admin"""

    reset_req = db.query(user_model.PasswordResetRequest).filter(
        user_model.PasswordResetRequest.id == input_data.request_id
    ).first()

    if not reset_req:
        raise HTTPException(
            status_code=404,
            detail="Demande introuvable"
        )

    # Récupérer l'utilisateur pour forcer must_change_password = True
    user = db.query(user_model.User).filter(user_model.User.email == reset_req.email).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur introuvable"
        )

    new_hash = security.get_password_hash(input_data.new_password)
    user.hashed_password = new_hash
    user.must_change_password = True
    db.commit()

    user_crud.mark_reset_request_done(db, input_data.request_id)

    # Envoi de l'email réel
    try:
        from app.services.email_service import send_password_reset_notification
        send_password_reset_notification(
            to_email=reset_req.email,
            nom=user.nom or reset_req.email.split('@')[0],
            new_password=input_data.new_password
        )
    except Exception as e:
        print(f"Erreur d'envoi de l'email de notification de réinitialisation: {e}")
    return {
        "message": f"Mot de passe réinitialisé et envoyé à {reset_req.email}",
        "new_password": input_data.new_password
    }


# ==========================================================
# GESTION DES RÉINITIALISATIONS CLIENTS (PAR L'ADMIN/SUPERADMIN)
# ==========================================================

@router.get("/client/reset-requests")
def get_client_reset_requests(
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([
            user_model.UserRole.ADMIN,
            user_model.UserRole.SUPERADMIN
        ])
    )
):
    """Récupère toutes les demandes de réinitialisation des clients (role_id == 2) en attente"""
    requests = db.query(user_model.PasswordResetRequest)\
        .join(user_model.User, user_model.User.email == user_model.PasswordResetRequest.email)\
        .filter(user_model.User.role_id == 2)\
        .filter(user_model.PasswordResetRequest.status == "en_attente")\
        .all()
    return [
        {
            "id": r.id,
            "email": r.email,
            "status": r.status,
            "created_at": r.created_at
        }
        for r in requests
    ]

@router.post("/client/reset-password")
def client_reset_password(
    input_data: user_schema.AdminResetPasswordInput,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([
            user_model.UserRole.ADMIN,
            user_model.UserRole.SUPERADMIN
        ])
    )
):
    """L'administrateur ou le superadmin réinitialise le mot de passe d'un client"""

    reset_req = db.query(user_model.PasswordResetRequest).filter(
        user_model.PasswordResetRequest.id == input_data.request_id
    ).first()

    if not reset_req:
        raise HTTPException(
            status_code=404,
            detail="Demande introuvable"
        )

    # Récupérer l'utilisateur pour forcer must_change_password = True
    user = db.query(user_model.User).filter(user_model.User.email == reset_req.email).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur introuvable"
        )

    new_hash = security.get_password_hash(input_data.new_password)
    user.hashed_password = new_hash
    user.must_change_password = True
    db.commit()

    user_crud.mark_reset_request_done(db, input_data.request_id)

    # Envoi de l'email réel
    try:
        from app.services.email_service import send_password_reset_notification
        send_password_reset_notification(
            to_email=reset_req.email,
            nom=user.nom or reset_req.email.split('@')[0],
            new_password=input_data.new_password
        )
    except Exception as e:
        print(f"Erreur d'envoi de l'email de notification de réinitialisation: {e}")
    return {
        "message": f"Mot de passe réinitialisé et envoyé à {reset_req.email}",
        "new_password": input_data.new_password
    }


@router.post("/reset-password-confirm")
def reset_password_confirm(
    data: user_schema.ResetPasswordConfirm,
    db: Session = Depends(database.get_db)
):
    """Permet au client de réinitialiser son mot de passe avec un token valide"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Le lien de réinitialisation est invalide ou a expiré."
    )
    
    try:
        # Décoder le token
        payload = jwt.decode(data.token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if email is None or token_type != "reset":
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception

    # Vérifier l'existence de l'utilisateur
    user = user_crud.get_user_by_email(db, email=email)
    if not user:
        raise credentials_exception

    # Hasher et mettre à jour le MDP
    hashed_password = security.get_password_hash(data.new_password)
    success = user_crud.update_user_password(db, email=email, new_password_hash=hashed_password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de mettre à jour le mot de passe"
        )
        
    return {"message": "Votre mot de passe a été réinitialisé avec succès !"}


@router.post("/change-password-required")
def change_password_required(
    data: user_schema.ChangePasswordRequiredInput,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(security.get_current_user)
):
    """Permet à un utilisateur connecté de modifier son mot de passe de première connexion"""
    # Hasher le nouveau mot de passe
    hashed_password = security.get_password_hash(data.new_password)
    
    # Mettre à jour l'utilisateur et désactiver le flag
    current_user.hashed_password = hashed_password
    current_user.must_change_password = False
    db.commit()
    
    return {"message": "Votre mot de passe a été mis à jour avec succès !"}