# Script pour vider la table des réclamations
import sys
import os

# Ajouter le dossier parent au path pour pouvoir importer 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user_model import Claim

def clear_claims():
    db = SessionLocal()
    try:
        print("Suppression de toutes les réclamations de la base de données...")
        num_deleted = db.query(Claim).delete()
        db.commit()
        print(f"Succès : {num_deleted} réclamation(s) supprimée(s).")
    except Exception as e:
        db.rollback()
        print(f"Erreur lors de la suppression : {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_claims()
