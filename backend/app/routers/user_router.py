from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import app.models.user_model as user_model
import app.schemas.user_schema as user_schema
import app.crud.user_crud as user_crud
import app.core.database as database
import app.core.security as security


# Routeur
router = APIRouter(prefix="/users", tags=["Gestion des Utilisateurs"])


# ======================================
# Voir tous les utilisateurs
# SUPERADMIN seulement
# ======================================
@router.get("/", response_model=List[user_schema.UserResponse])
def get_all_users(
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([
            user_model.UserRole.SUPERADMIN
        ])
    )
):
    return user_crud.get_all_users(db)


# ======================================
# Voir son propre profil (connecté)
# ACCESSIBLE A TOUS
# ======================================
@router.get("/me", response_model=user_schema.UserResponse)
def get_current_user_profile(
    current_user: user_model.User = Depends(security.get_current_user)
):
    """Retourne le profil de l'utilisateur connecté"""
    return current_user


# ======================================
# Modifier son propre profil (connecté)
# ACCESSIBLE A TOUS
# ======================================
@router.put("/me", response_model=user_schema.UserResponse)
def update_current_user_profile(
    user_data: user_schema.UserUpdate,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(security.get_current_user)
):
    """Met à jour le profil de l'utilisateur connecté"""
    updated_user = user_crud.update_user(
        db=db,
        user_id=current_user.id,
        user_data=user_data
    )
    if not updated_user:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur introuvable"
        )
    return updated_user


# ======================================
# Créer un utilisateur
# SUPERADMIN seulement
# ======================================
@router.post("/", response_model=user_schema.UserResponse)
def create_user(
    user: user_schema.UserCreate,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([
            user_model.UserRole.SUPERADMIN
        ])
    )
):
    # Vérifier si email existe déjà
    existing_user = user_crud.get_user_by_email(db, email=user.email)

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Cet email existe déjà"
        )

    # Hasher le mot de passe
    hashed_password = security.get_password_hash(user.password)

    # Créer user
    db_user = user_crud.create_user(
        db=db,
        user=user,
        hashed_password=hashed_password
    )

    # Envoyer l'email de bienvenue
    try:
        from app.services.email_service import send_welcome_email
        role_label = "Administrateur" if str(db_user.role) == "UserRole.ADMIN" or db_user.role == user_model.UserRole.ADMIN else "Super Administrateur"
        send_welcome_email(
            to_email=db_user.email,
            nom=db_user.nom or db_user.email.split('@')[0],
            temp_password=user.password,
            role=role_label
        )
    except Exception as e:
        print(f"Erreur d'envoi de l'email de bienvenue: {e}")

    return db_user


# ======================================
# Modifier utilisateur
# SUPERADMIN seulement
# ======================================
@router.put("/{user_id}", response_model=user_schema.UserResponse)
def update_user(
    user_id: int,
    user_data: user_schema.UserUpdate,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([
            user_model.UserRole.SUPERADMIN
        ])
    )
):
    updated_user = user_crud.update_user(
        db=db,
        user_id=user_id,
        user_data=user_data
    )

    if not updated_user:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur introuvable"
        )

    return updated_user


# ======================================
# Désactiver utilisateur
# SUPERADMIN seulement
# ======================================
@router.put("/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([
            user_model.UserRole.SUPERADMIN
        ])
    )
):
    user = user_crud.deactivate_user(db, user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur introuvable"
        )

    return {"message": "Utilisateur désactivé avec succès"}


# ======================================
# Supprimer utilisateur
# SUPERADMIN seulement
# ======================================
@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([
            user_model.UserRole.SUPERADMIN
        ])
    )
):
    success = user_crud.delete_user(db, user_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur introuvable"
        )

    return {"message": "Utilisateur supprimé avec succès"}