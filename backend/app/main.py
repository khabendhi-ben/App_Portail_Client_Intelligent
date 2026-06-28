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

app = FastAPI(title="Portail Client Intelligent - Groupe Le Matin")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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