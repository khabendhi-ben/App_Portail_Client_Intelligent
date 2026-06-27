from sqlalchemy.orm import Session, joinedload
from typing import List
import app.models.user_model as user_model
import app.schemas.reclamation_schema as reclamation_schema

def create_client_reclamation(
    db: Session, 
    reclamation_data: reclamation_schema.ReclamationCreate, 
    user_id: int
) -> user_model.Claim:
    """
    Crée une réclamation pour un client connecté dans la base de données.
    """
    db_reclamation = user_model.Claim(
        user_id=user_id,
        announcement_id=reclamation_data.announcement_id,
        subject=reclamation_data.subject,
        description=reclamation_data.description,
        priority=reclamation_data.priority,
        status="open" # Statut initial de dépôt
    )
    db.add(db_reclamation)
    db.commit()
    db.refresh(db_reclamation)
    return db_reclamation

def get_client_reclamations(db: Session, user_id: int) -> List[user_model.Claim]:
    """
    Récupère toutes les réclamations déposées par un utilisateur (client),
    triées de la plus récente à la plus ancienne.
    """
    return db.query(user_model.Claim)\
             .options(joinedload(user_model.Claim.announcement))\
             .filter(user_model.Claim.user_id == user_id)\
             .order_by(user_model.Claim.created_at.desc())\
             .all()

def get_all_reclamations(
    db: Session,
    status: str = None,
    priority: str = None,
    client_id: int = None,
    search: str = None
) -> List[user_model.Claim]:
    """
    Récupère toutes les réclamations de la base avec des filtres optionnels de statut, priorité, client et recherche.
    Triées de la plus récente à la plus ancienne.
    """
    query = db.query(user_model.Claim).options(joinedload(user_model.Claim.announcement))
    
    if status:
        query = query.filter(user_model.Claim.status == status)
    if priority:
        query = query.filter(user_model.Claim.priority == priority)
    if client_id:
        query = query.filter(user_model.Claim.user_id == client_id)
    if search:
        search_filter = f"%{search}%"
        # Jointure pour chercher aussi dans le nom de l'utilisateur ou de l'entreprise du client
        query = query.join(user_model.Claim.user)\
                     .outerjoin(user_model.User.client_profile)\
                     .filter(
                         (user_model.Claim.subject.ilike(search_filter)) |
                         (user_model.Claim.description.ilike(search_filter)) |
                         (user_model.User.nom.ilike(search_filter)) |
                         (user_model.Client.company_name.ilike(search_filter))
                     )
                     
    return query.order_by(user_model.Claim.created_at.desc()).all()

def respond_to_reclamation(
    db: Session,
    reclamation_id: int,
    respond_data: reclamation_schema.ReclamationRespond
) -> user_model.Claim:
    """
    Associe la réponse de l'administrateur à la réclamation et met à jour son statut.
    """
    db_reclamation = db.query(user_model.Claim).filter(user_model.Claim.id == reclamation_id).first()
    if not db_reclamation:
        return None
    
    db_reclamation.admin_response = respond_data.admin_response
    db_reclamation.status = respond_data.status
    db.commit()
    db.refresh(db_reclamation)
    return db_reclamation
