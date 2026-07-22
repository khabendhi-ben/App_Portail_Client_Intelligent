# Portail Client Intelligent & Assistant IA — Groupe Le Matin

Bienvenue dans la documentation officielle du **Portail Client Intelligent** développé pour le **Groupe Le Matin**. 
Ce projet est une solution complète B2B permettant aux annonceurs de suivre leurs annonces publicitaires, de gérer leurs dossiers de réclamation et d'interagir avec un **Assistant Virtuel IA (Ministral )** ancré en temps réel sur leurs données.

---

## Table des Matières
1. [Architecture & Technologies](#-architecture--technologies)
2. [Prérequis Système](#-prérequis-système)
3. [Structure du Projet](#-structure-du-projet)
4. [Guide d'Installation de A à Z](#-guide-dinstallation-de-a-à-z)
   - [Étape 1 : Cloner / Télécharger le projet](#étape-1--cloner--télécharger-le-projet)
   - [Étape 2 : Configuration et Lancement du Backend (FastAPI)](#étape-2--configuration-et-lancement-du-backend-fastapi)
   - [Étape 3 : Configuration et Lancement du Frontend (React)](#étape-3--configuration-et-lancement-du-frontend-react)
5. [Configuration du Chatbot IA (Local / Cloud)](#-configuration-du-chatbot-ia-local--cloud)
6. [Comptes de Démonstration (Credentials par défaut)](#-comptes-de-démonstration-credentials-par-défaut)
7. [Documentation API Swagger & ReDoc](#-documentation-api-swagger--redoc)
8. [Exécution des Tests Automatisés & Couverture (83%)](#-exécution-des-tests-automatisés--couverture-83)
9. [Sécurité & Bonnes Pratiques](#-sécurité--bonnes-pratiques)

---

## 🛠 Architecture & Technologies

### 🔹 Backend
- **Framework :** FastAPI (Python 3.10+)
- **Base de Données :** PostgreSQL (SQLAlchemy 2.0 ORM & Alembic pour les migrations)
- **Authentification & Sécurité :** OAuth2 avec JWT (JSON Web Tokens), Hachage Bcrypt, Modèle RBAC (SuperAdmin, Admin, Client)
- **Chiffrement :** Cryptography (Fernet symétrique pour la protection des clés API)
- **Service E-mail :** SMTP asynchrone (Gmail / SMTP d'entreprise)
- **Tests Automatisés :** Pytest, Pytest-Cov (Couverture de code à **83%**)

### 🔹 Frontend
- **Framework :** React 18+ (Vite)
- **Design System :** Vanilla CSS3 moderne (Glassmorphism, Dark Mode ready, Micro-animations, Responsive)
- **Communication HTTP :** Axios avec Intercepteurs (injection automatique du Token Bearer JWT)

### 🔹 Intelligence Artificielle (Chatbot)
- **Modèle :** `mistralai/Ministral-3-8B-Instruct-2512` (ou tout modèle compatible OpenAI API)
- **Mode de Déploiement :** Serveur d'inférence local (Port 8003) avec basculement dynamique possible vers l'API Cloud officielle Mistral AI via le panneau SuperAdmin.

---

## Prérequis Système

Avant de commencer l'installation, assurez-vous d'avoir installé sur votre machine :
- **Python :** version 3.10 ou supérieure (`python --version`)
- **Node.js :** version 18.0 ou supérieure (`node -v`) & npm (`npm -v`)
- **Git :** (`git --version`)
- *(Optionnel)* **PostgreSQL :** Si vous souhaitez utiliser une vraie base PostgreSQL locale au lieu de la base SQLite de démonstration.

---

## Structure du Projet

```text
Projet_Portail_Client/
├── backend/                  # API REST FastAPI (Python)
│   ├── app/
│   │   ├── core/             # Sécurité JWT, Connexion BDD, Chiffrement Crypto
│   │   ├── crud/             # Couche DAO (Requêtes SQL d'accès aux données)
│   │   ├── models/           # Modèles SQLAlchemy (User, Client, Claim, Announcement, AI)
│   │   ├── routers/          # Contrôleurs/Routes API (/auth, /reclamations, /ai, /clients, /users, /stats)
│   │   ├── schemas/          # Schémas de validation Pydantic v2
│   │   ├── services/         # Services métiers (SMTP Email, Intégration LLM)
│   │   └── main.py           # Point d'entrée de l'application FastAPI
│   ├── tests/                # Suite de 33 tests automatisés Pytest
│   ├── .env                  # Fichier de variables d'environnement backend
│   ├── requirements.txt      # Dépendances Python
│   └── seed.py               # Script d'initialisation des comptes de démo
│
├── frontend/                 # Application Web React (Vite)
│   ├── src/
│   │   ├── components/       # Composants réutilisables (Navbar, Sidebar, Modales, Tables)
│   │   ├── pages/            # Pages par rôle (Client, Admin, SuperAdmin)
│   │   ├── services/         # Client API Axios avec intercepteurs JWT
│   │   └── App.jsx           # Routage principal React Router
│   ├── package.json          # Dépendances NPM
│   └── vite.config.js        # Configuration Vite
└── README.md                 # Le présent guide d'installation
```

---

## Guide d'Installation de A à Z

### Étape 1 : Cloner / Télécharger le projet
Ouvrez votre terminal et déplacez-vous dans le dossier de travail :
```bash
git clone https://github.com/votre-organisation/Projet_Portail_Client.git
cd Projet_Portail_Client
```

---

### Étape 2 : Configuration et Lancement du Backend (FastAPI)

1. **Accéder au dossier `backend` :**
   ```bash
   cd backend
   ```

2. **Créer un environnement virtuel Python :**
   - Sur Windows :
     ```powershell
     python -m venv venv
     ```
   - Sur Linux / macOS :
     ```bash
     python3 -m venv venv
     ```

3. **Activer l'environnement virtuel :**
   - Sur Windows (PowerShell) :
     ```powershell
     .\venv\Scripts\activate
     ```
   - Sur Linux / macOS :
     ```bash
     source venv/bin/activate
     ```

4. **Installer les dépendances Python :**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

5. **Configurer le fichier d'environnement `.env` :**
   Créez un fichier nommé `.env` à la racine du dossier `backend/` avec le contenu suivant :
   ```env
   # Clé secrète pour la signature des Tokens JWT
   SECRET_KEY=votre_cle_secrete_jwt_hyper_securisee_2026
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440

   # Clé symétrique pour le chiffrement des données (32 octets base64)
   ENCRYPTION_KEY=gK4V9Z1m8X3L2P0Q7R6T5U4V3W2X1Y0Z=

   # Base de données (SQLite par défaut pour la démo, ou PostgreSQL)
   DATABASE_URL=sqlite:///./portail_lematin.db
   # Exemple PostgreSQL: postgresql://postgres:password@localhost:5432/portail_lematin

   # Configuration du Chatbot IA Local (Groupe Le Matin)
   LLM_ENDPOINT=http://192.168.18.119:8003/v1/chat/completions
   LLM_MODEL=mistralai/Ministral-3-8B-Instruct-2512
   LLM_API_KEY=

   # Configuration du Serveur SMTP d'envoi d'e-mails
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=votre-email-support@lematin.ma
   SMTP_PASSWORD=votre-mot-de-passe-application
   SMTP_FROM_NAME=Groupe Le Matin
   ```

6. **Initialiser la base de données & Injecter les données de démonstration :**
   ```bash
   python seed.py
   ```
   *(Ce script crée les tables et génère les rôles SuperAdmin, Admin et Client par défaut).*

7. **Lancer le serveur de développement FastAPI :**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Le serveur backend est désormais opérationnel sur **`http://localhost:8000`**.

---

### Étape 3 : Configuration et Lancement du Frontend (React)

1. **Ouvrir un NOUVEAU terminal et accéder au dossier `frontend` :**
   ```bash
   cd Projet_Portail_Client/frontend
   ```

2. **Installer les packages Node.js :**
   ```bash
   npm install
   ```

3. **Lancer le serveur de développement React (Vite) :**
   ```bash
   npm run dev
   ```

4. **Accéder à l'application web :**
   Ouvrez votre navigateur sur **`http://localhost:5173`** (ou l'URL indiquée dans votre terminal).

---

## Configuration du Chatbot IA (Local / Cloud)

Par défaut, l'application est configurée pour utiliser le serveur d'inférence local du Groupe Le Matin :
* **URL locale :** `http://192.168.18.119:8003/v1/chat/completions`
* **Modèle :** `mistralai/Ministral-3-8B-Instruct-2512`

### Basculement dynamique vers l'API Cloud Mistral AI :
Si le serveur local est inaccessible ou en maintenance, le **Super-Administrateur** peut modifier la configuration en un clic directement depuis l'interface web (Sans toucher au code) :
1. Se connecter avec le compte Super-Administrateur.
2. Aller dans l'onglet **"Configuration LLM"**.
3. Remplacer l'URL par l'URL officielle Mistral Cloud (`https://api.mistral.ai/v1/chat/completions`), ajouter la clé API Cloud et enregistrer.

---

## Comptes de Démonstration (Credentials par défaut)

Pour tester tous les espaces de l'application :

| Rôle | Email | Mot de passe par défaut | Accès & Fonctionnalités |
| :--- | :--- | :--- | :--- |
| **Super-Administrateur** | `Superadmin@lematin.ma` | `admin123` | Tableau de bord exécutif, Gestion des admins, Config IA LLM, Logs système |
| **Administrateur** | `admin@lematin.ma` | `admin123` | Traitement des réclamations, Gestion des comptes clients, Supervision IA |


---

## Documentation API Swagger & ReDoc

FastAPI génère automatiquement la documentation interactive complète de l'API REST :

* **Swagger UI (Test interactif des routes) :** [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc (Documentation technique détaillée) :** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Exécution des Tests Automatisés & Couverture (83%)

Une suite complète de 33 tests automatisés a été rédigée pour garantir la stabilité du système.

### Lancer la suite de tests avec rapport de couverture :
Déplacez-vous dans le dossier `backend` avec l'environnement virtuel activé et lancez :

```bash
cd backend
python -m pytest --cov=app --cov-report=term-missing
```

### Résultats de couverture :
- **33/33 tests passés avec succès (100% de réussite)**.
- **Taux de couverture global : 83%** (Schemas 100%, Models 99%, Crypto 95%, Auth 89%, Routers 85%).

---

## 🛡 Sécurité & Bonnes Pratiques

1. **Isolation des données (Rôles RBAC) :** Chaque requête HTTP est interceptée par le middleware de sécurité FastAPI qui vérifie le jeton JWT et le niveau d'habilitation de l'utilisateur.
2. **Chiffrement des mots de passe :** Tous les mots de passe sont hachés avec l'algorithme fort `Bcrypt` avec du grain de sel (Salt) automatique.
3. **Protection des clés API :** La clé API du modèle LLM est stockée de manière cryptée en base de données via le module `Cryptography` (AES-Fernet).
4. **Authentification avec changement obligatoire de MDP :** Lors de la création d'un compte par l'administrateur, le client reçoit un mot de passe temporaire et est forcé de le modifier à sa première connexion.

---

## Support & Contact

Pour toute question technique ou demande d'assistance lors du déploiement :
- **Développeur :** Équipe PFE Portail Client
- **Entreprise Partenaire :** Groupe Le Matin (Maroc)
- **Version :** 1.0.0 (Production Ready)
