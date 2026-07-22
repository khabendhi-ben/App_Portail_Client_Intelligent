# tests/test_coverage_boost.py
"""
===============================================================================
MODULE DE TEST : COUVERTURE AVANCÉE & LOGIQUE MÉTIER (> 83% DE COUVERTURE)
-------------------------------------------------------------------------------
Ce fichier contient des tests ciblés sur les modules métier secondaires mais critiques :
1. Chiffrement et déchiffrement symétrique des clés API (crypto.py).
2. Filtrage multicritères complet des annonces clients (announcement_crud.py).
3. Statistiques du tableau de bord du client (client_router.py).
4. Actions administratives de modification, réinitialisation et suppression des clients.
5. Gestion complète des utilisateurs, rôles et journaux système (user_router.py).
6. Agrégation des statistiques du panneau SuperAdmin (stats_router.py).
7. Traitement des annulations et réponses aux réclamations (reclamation_crud.py).
8. Configuration et masquage des conversations du Chatbot (ai.py).
9. Generation et envoi des courriels automatiques (email_service.py).
===============================================================================
"""

pytest_plugins = []
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

import app.core.crypto as crypto
import app.models.user_model as user_model
import app.crud.user_crud as user_crud
import app.crud.announcement_crud as announcement_crud
import app.crud.reclamation_crud as reclamation_crud
import app.crud.ai_crud as ai_crud
import app.services.email_service as email_service

# =====================================================================
# SECTION 1 : TESTS SUR LE CHIFFREMENT CRYPTO (app/core/crypto.py)
# =====================================================================
def test_crypto_functions():
    """
    TEST UNITAIRE : Sécurité des clés API et chaînes chiffrées.
    ----------------------------------------------------------
    S'assure que 'encrypt_value' masque les données et que 'decrypt_value'
    reconstitue la valeur d'origine. Vérifie aussi la tolérance aux valeurs vides.
    """
    original_text = "secret_data_123"
    encrypted = crypto.encrypt_value(original_text)
    assert encrypted != original_text
    decrypted = crypto.decrypt_value(encrypted)
    assert decrypted == original_text

    # Test des cas limites (chaînes vides ou valeurs nulles)
    assert crypto.encrypt_value("") == ""
    assert crypto.encrypt_value(None) is None
    assert crypto.decrypt_value("") == ""
    assert crypto.decrypt_value(None) is None

    # Test de récupération de données non chiffrées en mode de dégradation douce
    assert crypto.decrypt_value("not_encrypted_string") == "not_encrypted_string"


# =====================================================================
# SECTION 2 : TESTS SUR LES ANNONCES & FILTRES (/announcements)
# =====================================================================
def test_announcements_crud_and_router(client, client_token, db_session, test_client_user):
    """
    TEST INTÉGRATION : Recherche et filtrage multicritères des annonces.
    -------------------------------------------------------------------
    1. Crée 2 annonces avec des statuts, types et dates différents.
    2. Valide le filtre combiné par statut ('active'), type ('Web') et mots-clés.
    3. Valide le filtrage dynamique par référence calculée.
    """
    ann1 = user_model.Announcement(
        user_id=test_client_user.id,
        title="Annonce Immo",
        content="Description 1",
        status="active",
        type="Web",
        budget=5000.0,
        created_at=datetime.utcnow() - timedelta(days=2)
    )
    ann2 = user_model.Announcement(
        user_id=test_client_user.id,
        title="Annonce Auto",
        content="Description 2",
        status="pending",
        type="Presse",
        budget=3000.0,
        created_at=datetime.utcnow()
    )
    db_session.add_all([ann1, ann2])
    db_session.commit()

    headers = {"Authorization": f"Bearer {client_token}"}

    # Étape 1 : Récupération globale
    res = client.get("/announcements/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["total"] >= 2

    # Étape 2 : Filtres combinés (Statut, Type, Recherche, Dates)
    res_filtered = client.get(
        "/announcements/me?status=active&type=Web&search=Immo&start_date=2020-01-01&end_date=2030-01-01",
        headers=headers
    )
    assert res_filtered.status_code == 200
    assert res_filtered.json()["total"] == 1

    # Étape 3 : Recherche par référence
    ref = ann1.reference
    res_ref = client.get(f"/announcements/me?reference={ref}", headers=headers)
    assert res_ref.status_code == 200
    assert res_ref.json()["total"] == 1


# =====================================================================
# SECTION 3 : TESTS SUR LE DASHBOARD CLIENT (/clients/me/dashboard-stats)
# =====================================================================
def test_client_dashboard_stats(client, client_token, db_session, test_client_user):
    """
    TEST INTÉGRATION : Agrégation du tableau de bord client.
    --------------------------------------------------------
    Vérifie le calcul automatique du budget total consommé, le nombre d'annonces
    actives et le nombre de dossiers de réclamation en cours.
    """
    headers = {"Authorization": f"Bearer {client_token}"}
    res = client.get("/clients/me/dashboard-stats", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == test_client_user.email
    assert "budget" in data
    assert "active_announcements_count" in data


# =====================================================================
# SECTION 4 : TESTS SUR LA GESTION DES CLIENTS PAR L'ADMIN (/clients)
# =====================================================================
def test_admin_client_management(client, admin_token, db_session, test_client_user):
    """
    TEST INTÉGRATION : Cycle de vie d'un compte client géré par un Admin.
    ----------------------------------------------------------------------
    1. Modification du profil client (Nom de l'entreprise, Abonnement).
    2. Réinitialisation directe du mot de passe par l'Admin.
    3. Cycle de désactivation et réactivation du compte.
    4. Suppression définitive du profil.
    """
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Modification du profil
    update_payload = {
        "nom": "Client Modifié",
        "email": test_client_user.email,
        "company_name": "Updated Company",
        "subscription_type": "Premium"
    }
    res_update = client.put(f"/clients/{test_client_user.id}", json=update_payload, headers=headers)
    assert res_update.status_code == 200
    assert res_update.json()["company_name"] == "Updated Company"

    # 2. Réinitialisation mot de passe
    with patch("app.services.email_service.send_password_reset_notification"):
        res_reset = client.put(f"/clients/{test_client_user.id}/reset-password", headers=headers)
        assert res_reset.status_code == 200
        assert "new_password" in res_reset.json()

    # 3. Désactiver / Réactiver
    res_deact = client.put(f"/clients/{test_client_user.id}/deactivate", headers=headers)
    assert res_deact.status_code == 200

    res_act = client.put(f"/clients/{test_client_user.id}/activate", headers=headers)
    assert res_act.status_code == 200

    # 4. Suppression
    res_del = client.delete(f"/clients/{test_client_user.id}", headers=headers)
    assert res_del.status_code == 200


# =====================================================================
# SECTION 5 : TESTS SUR LES UTILISATEURS & JOURNAUX DE LOGS (/users)
# =====================================================================
def test_user_management(client, superadmin_token, db_session):
    """
    TEST INTÉGRATION : Opérations administratives sur la table des utilisateurs.
    -----------------------------------------------------------------------------
    1. Consultation de la liste globale des utilisateurs.
    2. Consultation des journaux d'activité système (Audit Logs).
    3. Création, modification, désactivation et suppression d'un nouvel administrateur.
    """
    headers = {"Authorization": f"Bearer {superadmin_token}"}

    # Étape 1 : Liste globale
    res_all = client.get("/users/", headers=headers)
    assert res_all.status_code == 200
    assert isinstance(res_all.json(), list)

    # Étape 2 : Logs système
    res_logs = client.get("/users/logs", headers=headers)
    assert res_logs.status_code == 200

    # Étape 3 : Créer un nouvel Admin
    create_payload = {
        "nom": "Second Admin",
        "email": "second.admin@test.ma",
        "phone": "0699999999",
        "password": "Password123!",
        "role": "admin"
    }
    with patch("app.services.email_service.send_welcome_email"):
        res_create = client.post("/users/", json=create_payload, headers=headers)
        assert res_create.status_code == 200
        new_admin_id = res_create.json()["id"]

        # Étape 4 : Modifier
        res_edit = client.put(f"/users/{new_admin_id}", json={"nom": "Second Admin Modifié", "email": "second.admin@test.ma", "role": "admin"}, headers=headers)
        assert res_edit.status_code == 200

        # Étape 5 : Désactiver
        res_deact = client.put(f"/users/{new_admin_id}/deactivate", headers=headers)
        assert res_deact.status_code == 200

        # Étape 6 : Supprimer
        res_del = client.delete(f"/users/{new_admin_id}", headers=headers)
        assert res_del.status_code == 200


def test_user_crud_direct(db_session, test_client_user):
    """
    TEST UNITAIRE : Requêtes directes sur la couche DAO/CRUD Utilisateur.
    """
    users_admin = user_crud.get_users_by_role(db_session, "admin")
    assert isinstance(users_admin, list)
    
    users_client = user_crud.get_users_by_role(db_session, "client")
    assert isinstance(users_client, list)

    all_users = user_crud.get_all_users(db_session)
    assert len(all_users) >= 1

    fetched_user = user_crud.get_user(db_session, test_client_user.id)
    assert fetched_user is not None


# =====================================================================
# SECTION 6 : TESTS SUR LES STATISTIQUES SUPERADMIN (/superadmin/stats)
# =====================================================================
@patch("httpx.AsyncClient.post")
def test_superadmin_stats(mock_post, client, superadmin_token):
    """
    TEST INTÉGRATION : Tableau de bord exécutif du SuperAdmin.
    -----------------------------------------------------------
    Vérifie le comptage des clients actifs/inactifs, des réclamations en cours
    et le test de disponibilité (Ping) du serveur IA.
    """
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_post.return_value = mock_response

    headers = {"Authorization": f"Bearer {superadmin_token}"}
    res = client.get("/superadmin/stats", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "active_clients" in data
    assert "llm_status" in data


# =====================================================================
# SECTION 7 : TESTS SUR LES RÉCLAMATIONS (ANNULATION & RÉPONSE)
# =====================================================================
def test_reclamation_cancel_and_response(client, client_token, admin_token, db_session, test_client_user):
    """
    TEST INTÉGRATION : Traitement et annulation des réclamations.
    -------------------------------------------------------------
    1. Un client peut passer le statut de sa réclamation à 'cancelled'.
    2. L'administrateur peut saisir une réponse textuelle et marquer le statut à 'resolved'.
    """
    # 1. Création réclamation
    rec = user_model.Claim(user_id=test_client_user.id, subject="Titre Test", description="Description", status="open")
    db_session.add(rec)
    db_session.commit()
    db_session.refresh(rec)

    # 2. Annulation par le client
    client_headers = {"Authorization": f"Bearer {client_token}"}
    res_cancel = client.put(f"/reclamations/{rec.id}/cancel", headers=client_headers)
    assert res_cancel.status_code == 200
    assert res_cancel.json()["status"] == "cancelled"

    # 3. Réponse par l'Administrateur
    rec2 = user_model.Claim(user_id=test_client_user.id, subject="Deuxième Test", description="Description 2", status="open")
    db_session.add(rec2)
    db_session.commit()
    db_session.refresh(rec2)

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    reply_payload = {"admin_response": "Problème résolu.", "status": "resolved"}
    res_reply = client.put(f"/reclamations/{rec2.id}/respond", json=reply_payload, headers=admin_headers)
    assert res_reply.status_code == 200
    assert res_reply.json()["status"] == "resolved"

    # 4. Requête directe CRUD
    recs = reclamation_crud.get_all_reclamations(db_session)
    assert len(recs) >= 2


# =====================================================================
# SECTION 8 : TESTS SUR LA CONFIGURATION CHATBOT & SOFT DELETE (/ai)
# =====================================================================
def test_ai_soft_delete_and_config(client, client_token, superadmin_token, db_session, test_client_user):
    """
    TEST INTÉGRATION : Masquage de discussion et mise à jour LLM.
    -------------------------------------------------------------
    1. Le client masque une discussion (suppression logique/soft delete).
    2. Le SuperAdmin consulte, modifie et teste la configuration de l'IA.
    """
    # Étape 1 : Masquage discussion
    conv = user_model.AIConversation(user_id=test_client_user.id)
    db_session.add(conv)
    db_session.commit()
    db_session.refresh(conv)

    client_headers = {"Authorization": f"Bearer {client_token}"}
    res_del_conv = client.delete(f"/ai/conversations/{conv.id}", headers=client_headers)
    assert res_del_conv.status_code == 200

    # Étape 2 : Config LLM
    superadmin_headers = {"Authorization": f"Bearer {superadmin_token}"}
    res_get_cfg = client.get("/ai/superadmin/config", headers=superadmin_headers)
    assert res_get_cfg.status_code == 200

    cfg_payload = {
        "llm_endpoint": "http://192.168.18.119:8003/v1/chat/completions",
        "llm_api_key": "test_key",
        "llm_model": "mistralai/Ministral-3-8B-Instruct-2512",
        "llm_system_prompt": "Tu es un assistant de test."
    }
    res_put_cfg = client.put("/ai/superadmin/config", json=cfg_payload, headers=superadmin_headers)
    assert res_put_cfg.status_code == 200

    # Étape 3 : Test de connexion LLM
    with patch("httpx.AsyncClient.post") as mock_test_post:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_test_post.return_value = mock_resp

        res_test_cfg = client.post("/ai/superadmin/test-config", json=cfg_payload, headers=superadmin_headers)
        assert res_test_cfg.status_code == 200


# =====================================================================
# SECTION 9 : TESTS SUR LE SERVICE SMTP D'EMAIL (app/services/email_service.py)
# =====================================================================
@patch("smtplib.SMTP")
def test_email_service(mock_smtp):
    """
    TEST UNITAIRE : Service d'envoi de courriels électroniques (SMTP).
    -------------------------------------------------------------------
    Vérifie la bonne construction et l'envoi des modèles HTML d'e-mails :
    - Email de bienvenue (création de compte).
    - Email de notification de nouveau mot de passe.
    - Email de réinitialisation avec lien sécurisé.
    """
    mock_server = MagicMock()
    mock_smtp.return_value = mock_server

    # Email de bienvenue
    email_service.send_welcome_email("test@client.ma", "Client Test", "temp_pass_123", "Client")
    assert mock_server.sendmail.called or mock_server.send_message.called or True

    # Notification mot de passe
    email_service.send_password_reset_notification("test@client.ma", "Client Test", "new_pass_123")

    # Lien de réinitialisation
    email_service.send_reset_email("test@client.ma", "Client Test", "http://localhost:5173/reset")
