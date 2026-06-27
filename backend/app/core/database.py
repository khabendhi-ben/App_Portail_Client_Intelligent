#Établit la connexion avec la base de données 
#PostgreSQL via SQLAlchemy.

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# URL de connexion chargée depuis le fichier .env (avec un fallback en local)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/portail_client")

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
