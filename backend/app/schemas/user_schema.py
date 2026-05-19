from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user_model import UserRole

# Schéma pour la réponse du Token
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# Schéma de base pour un utilisateur
class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.CLIENT

# Schéma pour la création d'un utilisateur (Données reçues du client)
class UserCreate(UserBase):
    password: str

# Schéma pour l'affichage d'un utilisateur (Données renvoyées au client)
class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True # Permet de convertir un modèle SQLAlchemy en Pydantic

# Schéma pour le Login
class UserLogin(BaseModel):
    email: EmailStr
    password: str
