#Le point d'entrée principal de l'API. 
# Il initialise l'application FastAPI, 
# configure les sécurités (CORS) et 
# rassemble tous les routers.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth_router import router as auth_router
from app.routers.user_router import router as user_router
from app.routers.client_router import router as client_router
from app.routers.announcement_router import router as announcement_router
from app.routers.reclamation_router import router as reclamation_router
from app.routers.ai import router as ai_router
from app.routers.stats_router import router as stats_router

tags_metadata = [
    {
        "name": "Authentification",
        "description": "Opérations de connexion, déconnexion et réinitialisation de mot de passe (JWT).",
    },
    {
        "name": "Gestion des Utilisateurs",
        "description": "Opérations d'administration sur les profils utilisateurs et modification des coordonnées.",
    },
    {
        "name": "Gestion des Clients",
        "description": "Administration et création de comptes clients (Annonceurs) avec automatisation SMTP.",
    },
    {
        "name": "Gestion des Annonces",
        "description": "CRUD et historique des annonces publicitaires associées aux clients.",
    },
    {
        "name": "Gestion des Réclamations",
        "description": "Système de tickets pour soumettre, lister et répondre aux réclamations clients.",
    },
    {
        "name": "Assistant IA Chatbot",
        "description": "Discussion asynchrone intelligente (Mistral LLM) avec streaming SSE et monitoring.",
    },
    {
        "name": "SuperAdmin Stats",
        "description": "Statistiques et indicateurs de performance pour le tableau de bord SuperAdmin.",
    },
]

app = FastAPI(
    title="Portail Client B2B Intelligent - Groupe Le Matin",
    description="API REST sécurisée pour le portail B2B du Groupe Le Matin, incluant l'authentification JWT, la gestion des annonces, des réclamations, et un assistant virtuel IA.",
    version="1.0.0",
    openapi_tags=tags_metadata,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Conversation-Id"],
)

@app.get("/")
def read_root():
    return {"message": "API OK"}

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(client_router)
app.include_router(announcement_router)
app.include_router(reclamation_router)
app.include_router(ai_router)
app.include_router(stats_router)