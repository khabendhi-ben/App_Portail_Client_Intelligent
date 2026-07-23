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


# Auto-migration pour ajouter ip_address et severity si elles manquent
from sqlalchemy import text

def check_and_update_database_columns():
    # Import des modèles pour enregistrement des métadonnées
    import app.models.user_model as user_model
    # Création automatique de toutes les tables si elles n'existent pas
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Vérifier si la colonne 'ip_address' existe
        result_ip = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='LOGS_SYSTEM' AND column_name='ip_address'")).fetchone()
        if not result_ip:
            db.execute(text('ALTER TABLE "LOGS_SYSTEM" ADD COLUMN ip_address VARCHAR(255) NULL'))
            db.commit()
            print("Auto-migration : Colonne 'ip_address' ajoutée avec succès.")
        
        # Vérifier si la colonne 'severity' existe
        result_severity = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='LOGS_SYSTEM' AND column_name='severity'")).fetchone()
        if not result_severity:
            db.execute(text('ALTER TABLE "LOGS_SYSTEM" ADD COLUMN severity VARCHAR(50) DEFAULT \'INFO\''))
            db.commit()
            print("Auto-migration : Colonne 'severity' ajoutée avec succès.")
            
        # Vérifier si la colonne 'is_deleted_by_client' existe
        result_deleted = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='IA_CONVERSATIONS' AND column_name='is_deleted_by_client'")).fetchone()
        if not result_deleted:
            db.execute(text('ALTER TABLE "IA_CONVERSATIONS" ADD COLUMN is_deleted_by_client BOOLEAN DEFAULT FALSE NOT NULL'))
            db.commit()
            print("Auto-migration : Colonne 'is_deleted_by_client' ajoutée avec succès.")
    except Exception as e:
        print(f"Auto-migration de la base de données : {e}")
    finally:
        db.close()

# Lancer la vérification
check_and_update_database_columns()


# Ce fichier gère la connexion à PostgreSQL.
