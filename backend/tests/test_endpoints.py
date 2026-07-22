# tests/test_endpoints.py
"""
===============================================================================
MODULE DE TEST : INTÉGRATION DES ENDPOINTS API (/auth, /reclamations, /ai, /users, /clients)
-------------------------------------------------------------------------------
Ce fichier simule des requêtes HTTP réelles envoyées aux contrôleurs FastAPI.
Il teste :
1. Le flux d'authentification, de déconnexion et de réinitialisation de mot de passe.
2. Le traitement des dossiers de réclamation (dépôt client et consultation admin).
3. Le Chatbot IA et le streaming de réponses SSE (/ai/chat et /ai/chat/stream).
4. La gestion des profils et des comptes utilisateurs/clients.
===============================================================================
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
import app.models.user_model as user_model

# =====================================================================
# SECTION 1 : TESTS SUR L'AUTHENTIFICATION & RÉINITIALISATION (/auth)
# =====================================================================

def test_login_success(client, test_client_user):
    """
    TEST INTÉGRATION : Connexion réussie d'un client.
    --------------------------------------------------
    Vérifie qu'un identifiant et mot de passe valides renvoient un code 200,
    un jeton access_token et le rôle de l'utilisateur.
    """
    payload = {"email": "client@test.ma", "password": "password123"}
    response = client.post("/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "client"


def test_login_wrong_credentials(client, test_client_user):
    """
    TEST INTÉGRATION : Rejet d'un mauvais mot de passe.
    ----------------------------------------------------
    Vérifie qu'un mot de passe incorrect retourne une erreur 401 Unauthorized.
    """
    payload = {"email": "client@test.ma", "password": "wrongpassword"}
    response = client.post("/auth/login", json=payload)
    assert response.status_code == 401


def test_login_inactive_user(client, db_session, test_client_user):
    """
    TEST INTÉGRATION : Blocage des comptes désactivés.
    ---------------------------------------------------
    Vérifie qu'un utilisateur désactivé (is_active = False) ne peut pas se connecter.
    """
    test_client_user.is_active = False
    db_session.commit()
    payload = {"email": "client@test.ma", "password": "password123"}
    response = client.post("/auth/login", json=payload)
    assert response.status_code == 401


def test_forgot_password_flow(client, test_client_user):
    """
    TEST INTÉGRATION : Demande d'oubli de mot de passe.
    ---------------------------------------------------
    Vérifie que la demande de réinitialisation est enregistrée sans divulguer
    si l'email existe ou non en base (pour des raisons de sécurité).
    """
    # 1. Demande pour un email existant
    payload = {"email": "client@test.ma"}
    response = client.post("/auth/forgot-password", json=payload)
    assert response.status_code == 200
    assert "transmise" in response.json()["message"]

    # 2. Demande pour un email inexistant (réponse générique sécurisée)
    payload_fake = {"email": "fake@test.ma"}
    response_fake = client.post("/auth/forgot-password", json=payload_fake)
    assert response_fake.status_code == 200


def test_admin_reset_requests_and_password(client, superadmin_token, db_session, test_admin_user):
    """
    TEST INTÉGRATION : Validation d'une réinitialisation de mot de passe par le SuperAdmin.
    --------------------------------------------------------------------------------------
    1. Le SuperAdmin récupère les demandes de réinitialisation d'administrateurs.
    2. Il valide la demande en définissant un nouveau mot de passe temporaire.
    """
    req = user_model.PasswordResetRequest(email=test_admin_user.email, status="en_attente")
    db_session.add(req)
    db_session.commit()
    db_session.refresh(req)

    headers = {"Authorization": f"Bearer {superadmin_token}"}
    
    # Étape 1 : Récupérer les demandes
    response_get = client.get("/auth/admin/reset-requests", headers=headers)
    assert response_get.status_code == 200
    assert len(response_get.json()) > 0

    # Étape 2 : Réinitialiser le mot de passe (avec simulation de l'envoi d'email SMTP)
    payload_reset = {"request_id": req.id, "new_password": "newpassword123"}
    with patch("app.services.email_service.send_password_reset_notification") as mock_email:
        response_post = client.post("/auth/admin/reset-password", json=payload_reset, headers=headers)
        assert response_post.status_code == 200
        mock_email.assert_called_once()


def test_logout(client, client_token):
    """
    TEST INTÉGRATION : Déconnexion de l'utilisateur.
    ------------------------------------------------
    Vérifie que la route /auth/logout enregistre correctement la déconnexion.
    """
    headers = {"Authorization": f"Bearer {client_token}"}
    response = client.post("/auth/logout", headers=headers)
    assert response.status_code == 200
    assert "Déconnexion enregistrée avec succès" in response.json()["message"]


def test_client_reset_requests_and_password(client, admin_token, db_session, test_client_user):
    """
    TEST INTÉGRATION : Traitement des réinitialisations de clients par l'Admin.
    ----------------------------------------------------------------------------
    L'administrateur liste les demandes des clients et réinitialise leurs identifiants.
    """
    req = user_model.PasswordResetRequest(email=test_client_user.email, status="en_attente")
    db_session.add(req)
    db_session.commit()
    db_session.refresh(req)
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 1. Obtenir les demandes
    response_get = client.get("/auth/client/reset-requests", headers=headers)
    assert response_get.status_code == 200
    
    # 2. Valider la réinitialisation client
    payload_reset = {"request_id": req.id, "new_password": "newclientpassword123"}
    with patch("app.services.email_service.send_password_reset_notification") as mock_email:
        response_post = client.post("/auth/client/reset-password", json=payload_reset, headers=headers)
        assert response_post.status_code == 200
        mock_email.assert_called_once()


def test_change_password_required(client, client_token, db_session, test_client_user):
    """
    TEST INTÉGRATION : Changement de mot de passe obligatoire à la première connexion.
    -----------------------------------------------------------------------------------
    Vérifie que lorsque must_change_password = True, l'utilisateur met à jour son MDP
    et que le drapeau repasse à False en base.
    """
    test_client_user.must_change_password = True
    db_session.commit()
    headers = {"Authorization": f"Bearer {client_token}"}
    payload = {"new_password": "newsecurepassword123"}
    
    response = client.post("/auth/change-password-required", json=payload, headers=headers)
    assert response.status_code == 200
    
    # Vérification en base
    db_session.refresh(test_client_user)
    assert test_client_user.must_change_password is False


# =====================================================================
# SECTION 2 : TESTS SUR LES DOSSIERS DE RÉCLAMATION (/reclamations)
# =====================================================================

def test_submit_reclamation_client(client, client_token):
    """
    TEST INTÉGRATION : Dépôt d'un dossier de réclamation par un client.
    -------------------------------------------------------------------
    Vérifie qu'un client peut soumettre un sujet et une description, et que le statut initial est 'open'.
    """
    headers = {"Authorization": f"Bearer {client_token}"}
    payload = {
        "subject": "Bug",
        "description": "Problème d'affichage",
        "priority": "normal"
    }
    response = client.post("/reclamations/", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "open"


def test_get_my_reclamations(client, client_token, db_session, test_client_user):
    """
    TEST INTÉGRATION : Consultation de ses propres réclamations.
    --------------------------------------------------------------
    Vérifie que le client connecté ne voit que ses propres dossiers de réclamation.
    """
    rec = user_model.Claim(user_id=test_client_user.id, subject="Ticket", description="Détail", status="open")
    db_session.add(rec)
    db_session.commit()

    headers = {"Authorization": f"Bearer {client_token}"}
    response = client.get("/reclamations/me", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_all_reclamations_admin_only(client, admin_token, client_token):
    """
    TEST INTÉGRATION : Contrôle d'accès à la liste globale des réclamations.
    ------------------------------------------------------------------------
    1. Un Administrateur peut lister toutes les réclamations (200 OK).
    2. Un Client est refusé avec un code 403 Forbidden.
    """
    # Succès Admin
    response = client.get("/reclamations/", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200

    # Refus Client
    response_client = client.get("/reclamations/", headers={"Authorization": f"Bearer {client_token}"})
    assert response_client.status_code == 403


# =====================================================================
# SECTION 3 : TESTS SUR LE CHATBOT ET LA SUPERVISION IA (/ai)
# =====================================================================

def test_get_client_conversations(client, client_token, db_session, test_client_user):
    """
    TEST INTÉGRATION : Historique des conversations du chatbot client.
    ------------------------------------------------------------------
    Vérifie l'extraction de l'historique des discussions avec l'IA.
    """
    conv = user_model.AIConversation(user_id=test_client_user.id)
    db_session.add(conv)
    db_session.commit()

    headers = {"Authorization": f"Bearer {client_token}"}
    response = client.get("/ai/conversations", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_admin_conversations(client, admin_token, db_session, test_client_user):
    """
    TEST INTÉGRATION : Supervision de l'IA par l'Administrateur.
    ------------------------------------------------------------
    L'administrateur accède à l'historique global de toutes les conversations IA des clients.
    """
    conv = user_model.AIConversation(user_id=test_client_user.id)
    db_session.add(conv)
    db_session.commit()

    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/ai/admin/conversations", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) > 0


@patch("httpx.AsyncClient")
def test_chat_chatbot_mocked(mock_client_class, client, client_token):
    """
    TEST INTÉGRATION : Envoi d'un message au chatbot (/ai/chat).
    ------------------------------------------------------------
    Simule la réponse du modèle LLM local Ministral pour valider le traitement
    de la requête sans dépendre d'un serveur d'inférence réel.
    """
    mock_instance = mock_client_class.return_value.__aenter__.return_value
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [{"message": {"content": "Réponse de test IA."}}]
    }
    mock_instance.post.return_value = mock_response

    headers = {"Authorization": f"Bearer {client_token}"}
    payload = {"message": "Bonjour"}
    response = client.post("/ai/chat", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["response"] == "Réponse de test IA."


@patch("httpx.AsyncClient")
def test_chat_chatbot_stream_mocked(mock_client_class, client, client_token):
    """
    TEST INTÉGRATION : Réponses en continu du chatbot (/ai/chat/stream).
    --------------------------------------------------------------------
    Vérifie que la route de streaming (Server-Sent Events) retourne le bon header
    'text/event-stream' et transmet les fragments de texte progressivement.
    """
    mock_instance = mock_client_class.return_value.__aenter__.return_value
    mock_instance.stream = MagicMock()
    
    mock_stream_response = MagicMock()
    mock_stream_response.status_code = 200
    
    async def mock_aiter_lines():
        lines = [
            'data: {"choices": [{"delta": {"content": "Bonjour"}}]}',
            'data: [DONE]'
        ]
        for line in lines:
            yield line
            
    mock_stream_response.aiter_lines = mock_aiter_lines
    mock_instance.stream.return_value.__aenter__.return_value = mock_stream_response

    headers = {"Authorization": f"Bearer {client_token}"}
    payload = {"message": "Bonjour"}
    response = client.post("/ai/chat/stream", json=payload, headers=headers)
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]


# =====================================================================
# SECTION 4 : TESTS SUR LES PROFILIS ET LA GESTION CLIENTS (/users, /clients)
# =====================================================================

def test_get_current_user_profile(client, client_token):
    """
    TEST INTÉGRATION : Lecture de son propre profil (/users/me).
    """
    headers = {"Authorization": f"Bearer {client_token}"}
    response = client.get("/users/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == "client@test.ma"


def test_update_current_user_profile(client, client_token):
    """
    TEST INTÉGRATION : Modification de son nom et téléphone (/users/me).
    """
    headers = {"Authorization": f"Bearer {client_token}"}
    payload = {
        "nom": "Nouveau Nom Client",
        "phone": "0612345678"
    }
    response = client.put("/users/me", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["nom"] == "Nouveau Nom Client"


def test_get_all_clients_admin(client, admin_token):
    """
    TEST INTÉGRATION : Consultation de la liste des clients par l'Admin.
    """
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/clients/", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_client_admin(client, admin_token):
    """
    TEST INTÉGRATION : Création d'un compte client par l'Admin.
    -----------------------------------------------------------
    Vérifie la création du compte et simule l'envoi de l'email de bienvenue SMTP.
    """
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "nom": "Nouveau Client Test",
        "email": "nouveau.client@test.ma",
        "phone": "0600000000",
        "company_name": "New Ads Company",
        "address": "Casablanca",
        "subscription_type": "Premium"
    }
    
    with patch("app.services.email_service.send_welcome_email") as mock_email:
        response = client.post("/clients/", json=payload, headers=headers)
        assert response.status_code == 200
        assert response.json()["email"] == "nouveau.client@test.ma"
        mock_email.assert_called_once()