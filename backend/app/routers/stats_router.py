from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import httpx
import asyncio

from app.core.database import get_db
from app.core.security import require_roles
from app.models.user_model import User, Claim, UserRole, Role, ConfigurationLLM

router = APIRouter(prefix="/superadmin", tags=["SuperAdmin Stats"])

@router.get("/stats")
async def get_superadmin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SUPERADMIN]))
):
    # 1. Clients actifs
    client_role = db.query(Role).filter(Role.nom == UserRole.CLIENT.value).first()
    if client_role:
        active_clients = db.query(func.count(User.id)).filter(
            User.role_id == client_role.id,
            User.is_active == True
        ).scalar()
        inactive_clients = db.query(func.count(User.id)).filter(
            User.role_id == client_role.id,
            User.is_active == False
        ).scalar()
    else:
        active_clients = 0
        inactive_clients = 0

    # 1.b Admins
    admin_role = db.query(Role).filter(Role.nom == UserRole.ADMIN.value).first()
    if admin_role:
        total_admins = db.query(func.count(User.id)).filter(User.role_id == admin_role.id).scalar()
        active_admins = db.query(func.count(User.id)).filter(
            User.role_id == admin_role.id,
            User.is_active == True
        ).scalar()
    else:
        total_admins = 0
        active_admins = 0

    # 2. Réclamations
    open_claims = db.query(func.count(Claim.id)).filter(Claim.status.in_(["open", "pending"])).scalar()
    resolved_claims = db.query(func.count(Claim.id)).filter(Claim.status == "resolved").scalar()

    # 3. LLM API Status
    llm_status = "Hors ligne"
    endpoint_config = db.query(ConfigurationLLM).filter(ConfigurationLLM.key_name == "llm_endpoint").first()
    
    if endpoint_config and endpoint_config.value:
        try:
            # We just test the domain/ip to see if it's reachable. Some endpoints might reject GET requests to /chat/completions
            # but even a 401/404/405 means the server is reachable and "online".
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(endpoint_config.value)
                # If we get here, the connection succeeded (even if HTTP status is an error like 405 Method Not Allowed)
                llm_status = "En ligne"
        except Exception:
            llm_status = "Hors ligne"

    # 4. Vraies données pour les graphiques
    from datetime import datetime, timedelta
    now = datetime.utcnow()

    # 4.a Évolution des clients actifs (Mois dernier, divisé en 4 semaines)
    thirty_days_ago = now - timedelta(days=30)
    
    # Total des clients AVANT les 30 derniers jours
    base_clients_count = db.query(func.count(User.id)).filter(
        User.role_id == client_role.id if client_role else True,
        User.created_at < thirty_days_ago,
        User.is_active == True
    ).scalar() or 0

    recent_clients = db.query(User.created_at).filter(
        User.role_id == client_role.id if client_role else True,
        User.created_at >= thirty_days_ago,
        User.is_active == True
    ).all()

    week_counts = [0, 0, 0, 0]
    for c in recent_clients:
        if c.created_at:
            days_ago = (now - c.created_at).days
            if days_ago <= 7:
                week_counts[3] += 1
            elif days_ago <= 14:
                week_counts[2] += 1
            elif days_ago <= 21:
                week_counts[1] += 1
            elif days_ago <= 30:
                week_counts[0] += 1

    client_evolution = []
    current_total = base_clients_count
    for i in range(4):
        current_total += week_counts[i]
        client_evolution.append({
            "month": f"Semaine {i+1}",
            "clients": current_total
        })

    # 4.b Réclamations (7 derniers jours)
    seven_days_ago = now - timedelta(days=7)
    recent_claims = db.query(Claim.created_at, Claim.status).filter(
        Claim.created_at >= seven_days_ago
    ).all()

    # Initialisation des 7 derniers jours
    claims_7_days = []
    day_names = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
    
    # Construction du tableau de base (du plus ancien au plus récent)
    for i in range(6, -1, -1):
        d = now - timedelta(days=i)
        claims_7_days.append({
            "date_obj": d.date(),
            "day": day_names[d.weekday()],
            "ouvertes": 0,
            "resolues": 0
        })

    for claim in recent_claims:
        if claim.created_at:
            c_date = claim.created_at.date()
            for day_data in claims_7_days:
                if day_data["date_obj"] == c_date:
                    if claim.status in ["open", "pending"]:
                        day_data["ouvertes"] += 1
                    elif claim.status == "resolved":
                        day_data["resolues"] += 1

    chart_data = {
        "client_evolution": client_evolution,
        "claims_7_days": claims_7_days
    }

    return {
        "active_clients": active_clients or 0,
        "inactive_clients": inactive_clients or 0,
        "active_admins": active_admins or 0,
        "total_admins": total_admins or 0,
        "open_claims": open_claims or 0,
        "resolved_claims": resolved_claims or 0,
        "llm_status": llm_status,
        "chart_data": chart_data
    }
