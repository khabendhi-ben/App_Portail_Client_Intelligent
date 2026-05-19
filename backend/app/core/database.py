from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# URL de connexion par défaut (à modifier selon votre config PostgreSQL locale)
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/portail_client"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Fonction pour récupérer une session de base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
        
        
        
# Ce fichier gère la connexion à PostgreSQL.        
