# C:\Users\Home\Downloads\Projet_Portail_Client\backend\tests\conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.core.database import Base, get_db
from app.main import app
import app.models.user_model as user_model
from app.core.security import get_password_hash, create_access_token

# Base de données SQLite en mémoire pour les tests
# StaticPool est nécessaire pour conserver la base en mémoire vive pendant toute la session de test
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def create_test_db():
    # Crée les tables SQLite avant de lancer les tests
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        # Créer les rôles requis en base (SuperAdmin=0, Admin=1, Client=2)
        roles = [
            user_model.Role(id=0, nom="superadmin", description="SuperAdministrateur"),
            user_model.Role(id=1, nom="admin", description="Administrateur"),
            user_model.Role(id=2, nom="client", description="Client")
        ]
        for r in roles:
            exists = db.query(user_model.Role).filter(user_model.Role.id == r.id).first()
            if not exists:
                db.add(r)
        db.commit()
    finally:
        db.close()
    yield
    # Supprime proprement les tables après la session de tests
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    # Fournit une session de base de données SQLite isolée pour chaque test (avec Rollback à la fin)
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    # Surcharge de la dépendance get_db de FastAPI pour injecter la base SQLite de test
    def override_get_db():
        try:
            yield session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()
    app.dependency_overrides.pop(get_db, None)

@pytest.fixture
def client(db_session):
    # Client HTTP simulé pour appeler notre API FastAPI
    with TestClient(app) as c:
        yield c

# Fixtures pour créer des utilisateurs de test et leurs tokens JWT associés
@pytest.fixture
def test_client_user(db_session):
    # Crée un client de test
    user = user_model.User(
        nom="Test Client",
        email="client@test.ma",
        phone="0612345678",
        hashed_password=get_password_hash("password123"),
        role_id=2,  # Client
        is_active=True,
        must_change_password=False
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    # Crée le profil lié dans la table CLIENTS
    profile = user_model.Client(
        user_id=user.id,
        company_name="Test Company",
        phone="0612345678",
        address="123 Test Street",
        subscription_type="Standard",
        budget=5000.0
    )
    db_session.add(profile)
    db_session.commit()
    return user

@pytest.fixture
def test_admin_user(db_session):
    # Crée un administrateur de test
    user = user_model.User(
        nom="Test Admin",
        email="admin@test.ma",
        phone="0687654321",
        hashed_password=get_password_hash("password123"),
        role_id=1,  # Admin
        is_active=True,
        must_change_password=False
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def client_token(test_client_user):
    return create_access_token(data={"sub": test_client_user.email, "role": "client"})

@pytest.fixture
def admin_token(test_admin_user):
    return create_access_token(data={"sub": test_admin_user.email, "role": "admin"})

@pytest.fixture
def test_superadmin_user(db_session):
    # Crée un super-administrateur de test (role_id = 0)
    user = user_model.User(
        nom="Test SuperAdmin",
        email="superadmin@test.ma",
        phone="0699999999",
        hashed_password=get_password_hash("password123"),
        role_id=0,  # SuperAdmin
        is_active=True,
        must_change_password=False
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user
@pytest.fixture
def superadmin_token(test_superadmin_user):
    return create_access_token(data={"sub": test_superadmin_user.email, "role": "superadmin"})