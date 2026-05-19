from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth_router

app = FastAPI(title="Portail Client Intelligent - Groupe Le Matin")

# Configuration du CORS (Pour que React puisse parler à FastAPI)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Port par défaut de Vite/React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'API du Portail Client Intelligent"}

# On branche le router d'authentification
app.include_router(auth_router.router)
