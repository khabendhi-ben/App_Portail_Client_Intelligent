#Script utilitaire d'initialisation permettant 
# de peupler la base de données avec 
# les premiers utilisateurs (SuperAdmin, Admin).


from backend.app.core.database import SessionLocal
from backend.app.models.user_model import User, UserRole
from backend.app.core.security import get_password_hash

def seed_data():
    db = SessionLocal()
    try:
        users_to_create = [
            {
                "email": "admin@lematin.ma",
                "password": "admin123",
                "role": UserRole.SUPERADMIN
            },
            {
                "email": "employe@lematin.ma",
                "password": "admin123",
                "role": UserRole.ADMIN
            },
            {
                "email": "client@test.ma",
                "password": "admin123",
                "role": UserRole.CLIENT
            }
        ]

        for user_info in users_to_create:
            exists = db.query(User).filter(User.email == user_info["email"]).first()
            if not exists:
                print(f"Création de l'utilisateur {user_info['email']} ({user_info['role']})...")
                new_user = User(
                    email=user_info["email"],
                    hashed_password=get_password_hash(user_info["password"]),
                    role=user_info["role"],
                    is_active=True
                )
                db.add(new_user)
        
        db.commit()
        print("Initialisation terminée avec succès !")
            
    except Exception as e:
        print(f"Erreur lors de la création : {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
