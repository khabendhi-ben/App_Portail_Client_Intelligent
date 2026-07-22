from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List

import app.models.user_model as user_model
import app.schemas.user_schema as user_schema
import app.crud.user_crud as user_crud
import app.core.database as database
import app.core.security as security

router = APIRouter(prefix="/clients", tags=["Gestion des Clients"])


# ======================================
# Voir tous les clients
# ADMIN + SUPERADMIN
# ======================================
@router.get("/", response_model=List[user_schema.ClientResponse])
def get_all_clients(
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([
            user_model.UserRole.ADMIN,
            user_model.UserRole.SUPERADMIN
        ])
    )
):
    clients = user_crud.get_all_clients_with_profile(db)
    result = []
    for client in clients:
        profile = user_crud.get_client_profile(db, client.id)
        result.append(user_schema.ClientResponse(
            id=client.id,
            nom=client.nom,
            email=client.email,
            phone=client.phone,
            role=client.role,
            is_active=client.is_active,
            company_name=profile.company_name if profile else None,
            address=profile.address if profile else None,
            subscription_type=profile.subscription_type if profile else None
        ))
    return result


# ======================================
# Créer un client
# ADMIN + SUPERADMIN
# MDP généré automatiquement
# ======================================
@router.post("/")
def create_client(
    client_data: user_schema.ClientCreate,
    request: Request,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([
            user_model.UserRole.ADMIN,
            user_model.UserRole.SUPERADMIN
        ])
    )
):
    # Vérifier si email existe déjà
    existing = user_crud.get_user_by_email(db, email=client_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Cet email existe déjà")

    # Générer un mot de passe automatique
    generated_password = security.generate_random_password()
    hashed_password = security.get_password_hash(generated_password)

    # Créer le client (User + profil)
    db_user, db_client = user_crud.create_client_with_profile(
        db=db,
        client_data=client_data,
        hashed_password=hashed_password
    )

    # Envoyer l'email de bienvenue au client
    try:
        from app.services.email_service import send_welcome_email
        send_welcome_email(
            to_email=db_user.email,
            nom=db_user.nom or client_data.nom,
            temp_password=generated_password,
            role="Client (Annonceur)"
        )
    except Exception as e:
        print(f"Erreur d'envoi de l'email de bienvenue: {e}")

    # Retourner les infos + le MDP généré (pour que l'Admin le communique)
    user_crud.log_action(
        db=db, action="CREATION_CLIENT",
        user_id=current_user.id,
        details=f"Nouveau client créé : {db_user.email} par {current_user.email}",
        ip_address=request.client.host if request.client else "inconnu",
        severity="INFO"
    )
    return {
        "id": db_user.id,
        "nom": db_user.nom,
        "email": db_user.email,
        "phone": db_user.phone,
        "role": db_user.role,
        "is_active": db_user.is_active,
        "company_name": db_client.company_name,
        "subscription_type": db_client.subscription_type,
        "generated_password": generated_password
    }


# ======================================
# Modifier un client
# ADMIN + SUPERADMIN
# ======================================
@router.put("/{client_id}")
def update_client(
    client_id: int,
    client_data: user_schema.ClientUpdate,
    request: Request,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([
            user_model.UserRole.ADMIN,
            user_model.UserRole.SUPERADMIN
        ])
    )
):
    # Vérifier que c'est bien un client
    target_user = user_crud.get_user(db, client_id)
    if not target_user or str(target_user.role) != "UserRole.CLIENT" and target_user.role != user_model.UserRole.CLIENT:
        raise HTTPException(status_code=404, detail="Client introuvable")

    db_user, db_client = user_crud.update_client_with_profile(
        db=db,
        user_id=client_id,
        client_data=client_data
    )

    if not db_user:
        raise HTTPException(status_code=404, detail="Client introuvable")

    profile = user_crud.get_client_profile(db, client_id)

    return {
        "id": db_user.id,
        "nom": db_user.nom,
        "email": db_user.email,
        "phone": db_user.phone,
        "role": db_user.role,
        "is_active": db_user.is_active,
        "company_name": profile.company_name if profile else None,
        "subscription_type": profile.subscription_type if profile else None
    }


# ======================================
# Réinitialiser le MDP d'un client
# ADMIN + SUPERADMIN
# ======================================
@router.put("/{client_id}/reset-password")
def reset_client_password(
    client_id: int,
    request: Request,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([
            user_model.UserRole.ADMIN,
            user_model.UserRole.SUPERADMIN
        ])
    )
):
    target_user = user_crud.get_user(db, client_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="Client introuvable")

    new_password = security.generate_random_password()
    new_hash = security.get_password_hash(new_password)
    user_crud.update_user_password(db, email=target_user.email, new_password_hash=new_hash)

    # Envoyer l'email de notification au client
    try:
        from app.services.email_service import send_password_reset_notification
        send_password_reset_notification(
            to_email=target_user.email,
            nom=target_user.nom or target_user.email.split('@')[0],
            new_password=new_password
        )
    except Exception as e:
        print(f"Erreur d'envoi de l'email au client: {e}")

    user_crud.log_action(
        db=db, action="RESET_MOT_DE_PASSE",
        user_id=current_user.id,
        details=f"MDP réinitialisé pour {target_user.email} par {current_user.email}",
        ip_address=request.client.host if request.client else "inconnu",
        severity="WARNING"
    )
    return {
        "message": f"Mot de passe réinitialisé pour {target_user.email}",
        "new_password": new_password
    }


# ======================================
# Désactiver un client
# ADMIN + SUPERADMIN
# ======================================
@router.put("/{client_id}/deactivate")
def deactivate_client(
    client_id: int,
    request: Request,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([
            user_model.UserRole.ADMIN,
            user_model.UserRole.SUPERADMIN
        ])
    )
):
    user = user_crud.deactivate_user(db, client_id)
    if not user:
        raise HTTPException(status_code=404, detail="Client introuvable")
    user_crud.log_action(
        db=db, action="COMPTE_DESACTIVE",
        user_id=current_user.id,
        details=f"Client désactivé : {user.email} par {current_user.email}",
        ip_address=request.client.host if request.client else "inconnu",
        severity="WARNING"
    )
    return {"message": "Client désactivé avec succès"}


# ======================================
# Réactiver un client
# ADMIN + SUPERADMIN
# ======================================
@router.put("/{client_id}/activate")
def activate_client(
    client_id: int,
    request: Request,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([
            user_model.UserRole.ADMIN,
            user_model.UserRole.SUPERADMIN
        ])
    )
):
    target_user = user_crud.get_user(db, client_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="Client introuvable")
    target_user.is_active = True
    db.commit()
    user_crud.log_action(
        db=db, action="COMPTE_REACTIVE",
        user_id=current_user.id,
        details=f"Client réactivé : {target_user.email} par {current_user.email}",
        ip_address=request.client.host if request.client else "inconnu",
        severity="INFO"
    )
    return {"message": "Client réactivé avec succès"}


# ======================================
# Supprimer un client
# ADMIN + SUPERADMIN
# ======================================
@router.delete("/{client_id}")
def delete_client(
    client_id: int,
    request: Request,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([
            user_model.UserRole.ADMIN,
            user_model.UserRole.SUPERADMIN
        ])
    )
):
    # Récupérer l'email avant suppression
    target = user_crud.get_user(db, client_id)
    target_email = target.email if target else f"ID {client_id}"
    # Supprimer d'abord le profil client
    profile = user_crud.get_client_profile(db, client_id)
    if profile:
        db.delete(profile)
        db.commit()
    # Puis supprimer le user
    success = user_crud.delete_user(db, client_id)
    if not success:
        raise HTTPException(status_code=404, detail="Client introuvable")
    user_crud.log_action(
        db=db, action="SUPPRESSION_COMPTE",
        user_id=current_user.id,
        details=f"Client supprimé : {target_email} par {current_user.email}",
        ip_address=request.client.host if request.client else "inconnu",
        severity="WARNING"
    )
    return {"message": "Client supprimé définitivement"}


# ======================================
# Voir les statistiques du tableau de bord
# CLIENT seulement
# ======================================
@router.get("/me/dashboard-stats", response_model=user_schema.ClientDashboardStats)
def get_client_dashboard_stats(
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([user_model.UserRole.CLIENT])
    )
):
    profile = user_crud.get_client_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profil client introuvable")

    active_announcements_count = db.query(user_model.Announcement).filter(
        user_model.Announcement.user_id == current_user.id
    ).count()

    open_claims_count = db.query(user_model.Claim).filter(
        user_model.Claim.user_id == current_user.id,
        user_model.Claim.status != 'resolved'
    ).count()

    claims_open_count = db.query(user_model.Claim).filter(
        user_model.Claim.user_id == current_user.id,
        user_model.Claim.status == 'open'
    ).count()

    claims_pending_count = db.query(user_model.Claim).filter(
        user_model.Claim.user_id == current_user.id,
        user_model.Claim.status == 'pending'
    ).count()

    claims_resolved_count = db.query(user_model.Claim).filter(
        user_model.Claim.user_id == current_user.id,
        user_model.Claim.status == 'resolved'
    ).count()

    # Calcul dynamique du budget total (somme des budgets de toutes les annonces du client)
    from sqlalchemy import func
    total_budget = db.query(func.sum(user_model.Announcement.budget)).filter(
        user_model.Announcement.user_id == current_user.id
    ).scalar() or 0.0

    return user_schema.ClientDashboardStats(
        nom=current_user.nom,
        email=current_user.email,
        phone=current_user.phone,
        address=profile.address,
        company_name=profile.company_name,
        subscription_type=profile.subscription_type,
        budget=float(total_budget),
        active_announcements_count=active_announcements_count,
        open_claims_count=open_claims_count,
        claims_open_count=claims_open_count,
        claims_pending_count=claims_pending_count,
        claims_resolved_count=claims_resolved_count
    )
