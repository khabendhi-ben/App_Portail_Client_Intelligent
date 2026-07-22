# Script pour insérer des annonces de test dans la base de données
import sys
import os

# Ajouter le dossier parent au path pour pouvoir importer 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user_model import User, Announcement

def add_mock_announcements():
    db = SessionLocal()
    try:
        # 1. Rechercher le client de test par défaut
        email = "kha.bendhi@gmail.com"
        client_user = db.query(User).filter(User.email == email).first()
        
        if not client_user:
            # Fallback : prendre le premier utilisateur avec le rôle client (role_id = 2)
            client_user = db.query(User).filter(User.role_id == 2).first()
            
        if not client_user:
            print("Erreur : Aucun utilisateur avec le rôle 'Client' n'a été trouvé dans la base de données.")
            print("Veuillez d'abord créer un client via l'interface d'administration.")
            return

        print(f"Insertion des annonces pour le client : {client_user.email} (ID: {client_user.id})")

        # 2. Définir des annonces de test
        mock_announcements = [
            Announcement(
                user_id=client_user.id,
                title="Campagne Ramadan 2026",
                content="Diffusion d'une bannière publicitaire sur la page d'accueil du site pour la campagne promotionnelle de Ramadan.",
                status="active",
                budget=15000.0,
                type="Bannière",
                support="Site Web Le Matin"
            ),
            Announcement(
                user_id=client_user.id,
                title="Promotion d'Été 2026",
                content="Publication d'une annonce pleine page dans le journal papier pour promouvoir nos offres d'été.",
                status="completed",
                budget=8500.0,
                type="Papier",
                support="Journal Le Matin"
            ),
            Announcement(
                user_id=client_user.id,
                title="Lancement Nouveau Produit",
                content="Campagne d'affichage publicitaire sur les supports digitaux du groupe Le Matin.",
                status="pending",
                budget=25000.0,
                type="Digital",
                support="Le Matin Digital"
            )
        ]

        # 3. Insérer les annonces si elles n'existent pas déjà
        for ann in mock_announcements:
            exists = db.query(Announcement).filter(
                Announcement.user_id == ann.user_id, 
                Announcement.title == ann.title
            ).first()
            
            if not exists:
                db.add(ann)
                print(f"  -> Annonce '{ann.title}' ajoutée.")
            else:
                print(f"  -> Annonce '{ann.title}' existe déjà (ignorée).")
        
        db.commit()
        print("\nInsertion terminée avec succès !")

    except Exception as e:
        db.rollback()
        print(f"Erreur lors de l'insertion : {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_mock_announcements()
