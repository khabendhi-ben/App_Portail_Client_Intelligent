from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

import app.models.user_model as user_model
import app.schemas.announcement_schema as announcement_schema
import app.crud.announcement_crud as announcement_crud
import app.core.database as database
import app.core.security as security

router = APIRouter(prefix="/announcements", tags=["Gestion des Annonces"])

@router.get("/me", response_model=announcement_schema.AnnouncementPaginationResponse)
def get_my_announcements(
    page: int = 1,
    limit: int = 10,
    status: Optional[str] = None,
    type: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    reference: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: user_model.User = Depends(
        security.require_roles([user_model.UserRole.CLIENT])
    )
):
    """
    Récupère la liste des annonces du client connecté avec filtrage et pagination.
    """
    if page < 1:
        page = 1
    if limit < 1:
        limit = 10
        
    items, total, pages = announcement_crud.get_client_announcements(
        db=db,
        user_id=current_user.id,
        page=page,
        limit=limit,
        status=status,
        type=type,
        search=search,
        start_date=start_date,
        end_date=end_date,
        reference=reference
    )
    
    return announcement_schema.AnnouncementPaginationResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )

