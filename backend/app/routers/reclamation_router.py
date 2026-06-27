from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import app.models.user_model as user_model
import app.schemas.reclamation_schema as reclamation_schema
import app.crud.reclamation_crud as reclamation_crud
import app.core.database as database
import app.core.security as security

router = APIRouter(prefix="/reclamations", tags=["Gestion des Réclamations"])

@router.post("/", response_model=reclamation_schema.ReclamationResponse)
def submit_reclamation(
    reclamation_data: reclamation_schema.ReclamationCreate,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([user_model.UserRole.CLIENT])
    )
):
    """
    Permet à un client de soumettre une nouvelle réclamation.
    """
    return reclamation_crud.create_client_reclamation(
        db=db,
        reclamation_data=reclamation_data,
        user_id=current_user.id
    )

@router.get("/me", response_model=List[reclamation_schema.ReclamationResponse])
def get_my_reclamations(
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([user_model.UserRole.CLIENT])
    )
):
    """
    Récupère l'historique complet des réclamations déposées par le client connecté.
    """
    return reclamation_crud.get_client_reclamations(
        db=db,
        user_id=current_user.id
    )

@router.get("/", response_model=List[reclamation_schema.ReclamationResponse])
def get_all_reclamations(
    status: str = None,
    priority: str = None,
    client_id: int = None,
    search: str = None,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([user_model.UserRole.ADMIN, user_model.UserRole.SUPERADMIN])
    )
):
    """
    Récupère toutes les réclamations de tous les clients avec filtres (réservé aux admins/superadmins).
    """
    return reclamation_crud.get_all_reclamations(
        db=db,
        status=status,
        priority=priority,
        client_id=client_id,
        search=search
    )

@router.put("/{reclamation_id}/respond", response_model=reclamation_schema.ReclamationResponse)
def respond_reclamation(
    reclamation_id: int,
    respond_data: reclamation_schema.ReclamationRespond,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([user_model.UserRole.ADMIN, user_model.UserRole.SUPERADMIN])
    )
):
    """
    Permet à un admin/superadmin de répondre à une réclamation et d'actualiser son statut.
    """
    updated_reclamation = reclamation_crud.respond_to_reclamation(
        db=db,
        reclamation_id=reclamation_id,
        respond_data=respond_data
    )
    if not updated_reclamation:
        raise HTTPException(status_code=404, detail="Réclamation introuvable")
    return updated_reclamation
