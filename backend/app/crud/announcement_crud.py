from sqlalchemy.orm import Session
from typing import Optional, Tuple, List
from datetime import datetime, time
import app.models.user_model as user_model

def get_client_announcements(
    db: Session,
    user_id: int,
    page: int,
    limit: int,
    status: Optional[str] = None,
    type: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    reference: Optional[str] = None
) -> Tuple[List[user_model.Announcement], int, int]:
    """
    Récupère les annonces associées à un utilisateur (client) avec filtres et pagination.
    Retourne un tuple : (liste_annonces, total_elements, total_pages)
    """
    query = db.query(user_model.Announcement).filter(user_model.Announcement.user_id == user_id)
    
    # Application des filtres
    if status and status.lower() != 'all':
        query = query.filter(user_model.Announcement.status == status)
        
    if type and type.lower() != 'all':
        query = query.filter(user_model.Announcement.type == type)
        
    if search:
        query = query.filter(user_model.Announcement.title.ilike(f"%{search}%"))
        
    # Filtres de date (format attendu YYYY-MM-DD)
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(user_model.Announcement.created_at >= start_dt)
        except ValueError:
            pass
            
    if end_date:
        try:
            # Pour inclure toute la journée de fin
            end_dt = datetime.combine(datetime.strptime(end_date, "%Y-%m-%d").date(), time.max)
            query = query.filter(user_model.Announcement.created_at <= end_dt)
        except ValueError:
            pass
        
    # Tri par date de création descendante
    query = query.order_by(user_model.Announcement.created_at.desc())

    if reference:
        # Filtrage en Python car reference est une propriété calculée
        all_items = query.all()
        ref_filtered = []
        ref_lower = reference.lower().strip()
        for item in all_items:
            item_ref = item.reference
            if item_ref and ref_lower in item_ref.lower():
                ref_filtered.append(item)
        
        total = len(ref_filtered)
        offset = (page - 1) * limit
        items = ref_filtered[offset:offset+limit]
        pages = (total + limit - 1) // limit if total > 0 else 1
        return items, total, pages
    else:
        # Tri et pagination standard en base de données
        total = query.count()
        offset = (page - 1) * limit
        items = query.offset(offset).limit(limit).all()
        pages = (total + limit - 1) // limit if total > 0 else 1
        return items, total, pages

