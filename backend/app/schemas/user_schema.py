# Couche "Validation" (Pydantic). 
# Définit les structures de données attendues 
# en entrée (requêtes du client) et 
# en sortie (réponses de l'API). 
# Garantit la sécurité en filtrant 
# les données (ex: cacher le mot de 
# passe dans la réponse).

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user_model import UserRole



class ForgotPasswordRequest(BaseModel):
    email: EmailStr

# Schéma pour la réponse du Token
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    must_change_password: bool

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# Schéma de base pour un utilisateur
class UserBase(BaseModel):
    nom: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
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
    
    
# Schéma pour renvoyer les informations d'un utilisateur (SANS le mot de passe !)
class UserResponse(BaseModel):
    id: int
    nom: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    role: UserRole
    is_active: bool

    # Ceci permet à Pydantic de lire les données directement depuis SQLAlchemy
    class Config:
        from_attributes = True


# Schéma pour la mise à jour d'un utilisateur
class UserUpdate(BaseModel):
    nom: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


# ─── Schémas pour les Clients ─────────────────────────────────

class ClientCreate(BaseModel):
    """Données pour créer un client complet (User + profil Client)"""
    nom: str
    email: EmailStr
    phone: Optional[str] = None
    company_name: str
    address: Optional[str] = None
    subscription_type: str = "Standard"
    budget: Optional[float] = 0.0

class ClientUpdate(BaseModel):
    """Données pour modifier un client"""
    nom: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    address: Optional[str] = None
    subscription_type: Optional[str] = None
    budget: Optional[float] = None

class ClientResponse(BaseModel):
    """Réponse avec les infos User + Client combinées"""
    id: int
    nom: Optional[str] = None
    email: str
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    company_name: Optional[str] = None
    address: Optional[str] = None
    subscription_type: Optional[str] = None
    budget: Optional[float] = None

    class Config:
        from_attributes = True


class ClientDashboardStats(BaseModel):
    nom: Optional[str] = None
    email: str
    company_name: Optional[str] = None
    subscription_type: Optional[str] = None
    budget: float
    active_announcements_count: int
    open_claims_count: int



class ResetPasswordConfirm(BaseModel):
    token: str
    new_password: str


class AdminResetPasswordInput(BaseModel):
    request_id: int
    new_password: str


class ChangePasswordRequiredInput(BaseModel):
    new_password: str



