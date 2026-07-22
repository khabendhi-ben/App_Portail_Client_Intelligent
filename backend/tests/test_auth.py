# tests/test_auth.py
"""
===============================================================================
MODULE DE TEST : AUTHENTIFICATION ET SÉCURITÉ JWT
-------------------------------------------------------------------------------
Ce fichier contient les tests unitaires couvrant la couche de sécurité :
1. La création et le décodage des jetons d'accès JWT (create_access_token).
2. Le hachage et la vérification des mots de passe sécurisés avec Bcrypt.
3. Le système de contrôle d'accès basé sur les rôles (RBAC - require_roles).
===============================================================================
"""

from jose import jwt
import pytest
from fastapi import HTTPException

import app.core.security as security
import app.models.user_model as user_model


def test_create_access_token():
    """
    TEST UNITAIRE : Vérification de la création d'un jeton d'accès JWT.
    -------------------------------------------------------------------
    Vérifie que la fonction 'create_access_token' génère une chaîne JWT valide
    contenant l'adresse email (sub), le rôle attribué et une date d'expiration (exp).
    """
    data = {"sub": "test@test.com", "role": "client"}
    token = security.create_access_token(data)
    
    # Décodage du token avec la clé secrète du système pour vérifier son intégrité
    decoded = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
    assert decoded["sub"] == "test@test.com"
    assert decoded["role"] == "client"
    assert "exp" in decoded


def test_verify_password():
    """
    TEST UNITAIRE : Vérification du hachage et de la comparaison des mots de passe.
    ------------------------------------------------------------------------------
    S'assure que 'get_password_hash' chiffre le texte en clair et que 'verify_password'
    retourne True uniquement lorsque le mot de passe fourni est correct.
    """
    password = "secret_password"
    hashed = security.get_password_hash(password)
    
    # Le bon mot de passe doit être validé
    assert security.verify_password(password, hashed) is True
    # Un mauvais mot de passe doit être rejeté
    assert security.verify_password("wrong_password", hashed) is False


def test_require_roles_client(test_client_user):
    """
    TEST UNITAIRE : Autorisation RBAC pour le rôle Client.
    ------------------------------------------------------
    Vérifie que la fonction 'require_roles' autorise l'accès lorsque l'utilisateur
    possède le rôle requis (ici UserRole.CLIENT).
    """
    client_role_checker = security.require_roles([user_model.UserRole.CLIENT])
    user = client_role_checker(test_client_user)
    assert user.id == test_client_user.id


def test_require_roles_unauthorized(test_client_user):
    """
    TEST UNITAIRE : Rejet d'accès RBAC (403 Forbidden).
    ----------------------------------------------------
    Vérifie qu'un utilisateur possédant le rôle Client ne peut pas accéder
    à une ressource réservée aux Administrateurs, et qu'une exception 403 est levée.
    """
    admin_role_checker = security.require_roles([user_model.UserRole.ADMIN])
    with pytest.raises(HTTPException) as exc_info:
        admin_role_checker(test_client_user)
        
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Accès refusé"