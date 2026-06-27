#Centralise la logique de sécurité 
# (hachage des mots de passe avec Bcrypt, 
#génération et vérification des Tokens JWT).

import secrets
import string
from jose import JWTError, jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

import app.crud.user_crud as user_crud
import app.core.database as database
import app.models.user_model as user_model

import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

SECRET_KEY = os.getenv("SECRET_KEY", "VOTRE_CLE_SECRET_TRES_LONGUE_ET_SECURISEE_GROUPE_LE_MATIN")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

def verify_password(plain_password, hashed_password):
    """Vérifie le mot de passe"""
    password_byte = plain_password.encode('utf-8')
    hashed_byte = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_byte, hashed_byte)

def get_password_hash(password):
    """Génère un hachage bcrypt"""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def generate_random_password(length=12):
    """Génère un mot de passe aléatoire pour le SuperAdmin"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for i in range(length))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Génère un Token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# FastAPI va chercher le token dans Authorization: Bearer ...
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db)
):
    """Retourne l'utilisateur connecté grâce au JWT"""

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        email: str = payload.get("sub")

        if email is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = user_crud.get_user_by_email(db, email=email)

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Votre compte a été désactivé.",
        )

    return user


def require_roles(allowed_roles: list):
    def role_checker(
        current_user: user_model.User = Depends(get_current_user)
    ):
        allowed_roles_str = [getattr(r, 'value', str(r)).split('.')[-1].lower() for r in allowed_roles]
        user_role_str = str(current_user.role).split('.')[-1].lower()
        if user_role_str not in allowed_roles_str:
            raise HTTPException(
                status_code=403,
                detail="Accès refusé"
            )
        return current_user

    return role_checker
