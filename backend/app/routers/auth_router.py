from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

import app.models.user_model as user_model
import app.schemas.user_schema as user_schema
import app.crud.user_crud as user_crud
import app.core.security as security
import app.core.database as database

router = APIRouter(prefix="/auth", tags=["Authentification"])

@router.post("/login", response_model=user_schema.Token)
def login_for_access_token(user_credentials: user_schema.UserLogin, db: Session = Depends(database.get_db)):
    """Route pour se connecter et obtenir un Token JWT"""
    
    # 1. Vérifier si l'utilisateur existe
    user = user_crud.get_user_by_email(db, email=user_credentials.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 2. Vérifier le mot de passe
    if not security.verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Générer le Token JWT
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email, "role": user.role}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@router.post("/forgot-password")
def request_password_reset(data: user_schema.UserLogin, db: Session = Depends(database.get_db)):
    """L'utilisateur demande une réinitialisation"""
    user = user_crud.get_user_by_email(db, email=data.email)
    if not user:
        return {"message": "Demande envoyée au SuperAdmin."}
    
    user_crud.create_reset_request(db, email=data.email)
    return {"message": "Votre demande a été transmise au SuperAdmin. Vous recevrez un email prochainement."}

@router.post("/admin/reset-password")
def admin_reset_password(request_id: int, db: Session = Depends(database.get_db)):
    """Le SuperAdmin réinitialise le mot de passe et l'envoie (Simulation)"""
    reset_req = db.query(user_model.PasswordResetRequest).filter(user_model.PasswordResetRequest.id == request_id).first()
    if not reset_req:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    
    new_password = security.generate_random_password()
    new_hash = security.get_password_hash(new_password)
    
    success = user_crud.update_user_password(db, email=reset_req.email, new_password_hash=new_hash)
    
    if success:
        user_crud.mark_reset_request_done(db, request_id)
        print(f"\n--- 📧 EMAIL ENVOYÉ À {reset_req.email} ---")
        print(f"Votre nouveau mot de passe est : {new_password}")
        print(f"------------------------------------------\n")
        return {"message": f"Mot de passe réinitialisé. Nouveau mot de passe envoyé à {reset_req.email}"}
    
    return {"error": "Impossible de mettre à jour le mot de passe."}
