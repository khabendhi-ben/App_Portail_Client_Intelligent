#  Cahier de Recette UAT Complet — Portail Client Intelligent (Groupe Le Matin)

Ce document contient l'ensemble des cas de tests d'acceptation utilisateur (UAT) détaillés pour chaque rôle (Client, Administrateur, Super-Administrateur). Ils sont rédigés selon la norme de qualité logicielle avec la structure de validation : *Prérequis*, *Action*, *Résultat attendu*.

---

##  SECTION 1 : Rôle Client Annonceur

###  Cas de test 1 : Connexion nominale (Comportement normal)
*   **Prérequis :** L'application est démarrée sous Docker et la base de données est initialisée avec le compte client de test (`client@test.ma` / `admin123`).
*   **Action :** 
    1. Ouvrir le navigateur et aller sur `http://localhost`.
    2. Saisir l'adresse email `client@test.ma`.
    3. Saisir le mot de passe `admin123`.
    4. Cliquer sur le bouton "Se connecter au portail".
*   **Résultat attendu :** L'utilisateur est authentifié avec succès, un Token JWT est stocké localement, et l'utilisateur est redirigé vers l'accueil de l'espace Client.
*   **Statut :** [ ] Réussi / [ ] Échoué


###  Cas de test 2 : Consultation et filtrage des annonces (Comportement normal)

*   **Prérequis :** Être connecté en tant que Client Annonceur.
*   **Action :** 
    1. Cliquer sur l'onglet **"Mes Annonces"** dans le menu latéral.
    2. Saisir le nom ou la référence d'une annonce dans la barre de recherche.
*   **Résultat attendu :** La liste complète des annonces du client s'affiche. Le filtrage/recherche s'effectue en temps réel pour n'afficher que l'annonce correspondante.
*   **Statut :** [ ] Réussi / [ ] Échoué

###  Cas de test 3 : Dépôt d'une réclamation depuis une annonce (Comportement normal)

*   **Prérequis :** Être connecté en tant que Client Annonceur.
*   **Action :**
    1. Cliquer sur l'onglet **"Mes Annonces"** dans le menu latéral.
    2. Repérer l'annonce concernée dans le tableau, puis cliquer sur l'icône des **trois points (...)** dans la colonne **Action**.
    3. Sélectionner l'option **"Réclamer"** dans le menu déroulant.
    4. Remplir le formulaire avec le descriptif de la réclamation (ex: *"Erreur de diffusion le 22 Juillet"*).
    5. Cliquer sur le bouton **"Réclamer"** pour valider.
*   **Résultat attendu :** Le formulaire se ferme, la réclamation est enregistrée en base de données. Elle apparaît immédiatement dans l'onglet **"Mes Réclamations"** du client, et est envoyée en temps réel dans l'espace de l'Administrateur pour être traitée.
*   **Statut :** [ ] Réussi / [ ] Échoué

###  Cas de test 4 : Discussion avec le Chatbot IA contextualisé (Comportement normal)

*   **Prérequis :** Être connecté en tant que Client Annonceur.
*   **Action :**
    1. Cliquer sur l'icône du Chatbot IA (assistant virtuel) en bas de l'écran.
    2. Poser la question suivante : *"Peux-tu me lister mes annonces en cours et me donner mon budget consommé ?"*
    3. Cliquer sur "Envoyer".
*   **Résultat attendu :** Le Chatbot interroge la base de données de manière sécurisée (contexte), extrait uniquement les annonces de ce client, et formule une réponse précise récapitulant les titres des annonces et le budget restant.
*   **Statut :** [ ] Réussi / [ ] Échoué


###  Cas de test 5 : Demande de réinitialisation de mot de passe (Comportement normal - SMTP)

*   **Prérequis :** Se trouver sur la page de connexion `http://localhost` (non connecté).
*   **Action :**
    1. Cliquer sur le lien **"Mot de passe oublié ?"**.
    2. Saisir l'adresse e-mail `client@test.ma`.
    3. Cliquer sur **"Envoyer le lien de réinitialisation"**.
*   **Résultat attendu :** L'application envoie une requête au serveur SMTP. Un e-mail contenant un lien sécurisé de réinitialisation temporaire est envoyé à l'adresse du client. Un message de confirmation vert s'affiche à l'écran.
*   **Statut :** [ ] Réussi / [ ] Échoué



##  SECTION 2 : Rôle Administrateur 

###  Cas de test 6 : Connexion nominale (Comportement normal)
*   **Prérequis :** L'application tourne sous Docker et le compte administrateur est créé (`employe@lematin.ma` / `admin123`).
*   **Action :**
    1. Aller sur `http://localhost`.
    2. Saisir l'adresse email `admin@lematin.ma`.
    3. Saisir le mot de passe `admin123`.
    4. Cliquer sur "Se connecter au portail".
*   **Résultat attendu :** L'administrateur  est connecté avec succès et est redirigé vers l'espace de gestion administrative.
*   **Statut :** [ ] Réussi / [ ] Échoué

###  Cas de test 7 : Modifier les informations (le profil) d'un client

*   **Prérequis :** Être connecté en tant qu'Administrateur, se trouver sur la page "Gestion des Clients".
*   **Action :**
    1. Cliquer sur le bouton **"Modifier"** en face d'un client dans la liste.
    2. Modifier le numéro de téléphone ou le nom de l'entreprise.
    3. Cliquer sur le bouton **"Enregistrer"**.
*   **Résultat attendu :** Un message de succès s'affiche. Les informations du client sont mises à jour en temps réel dans la base de données PostgreSQL.
*   **Statut :** [ ] Réussi / [ ] Échoué


###  Cas de test 8 : Résolution d'une réclamation (Comportement normal)

*   **Prérequis :** Être connecté en tant qu'Administrateur et avoir une réclamation ouverte dans la liste .
*   **Action :**
    1. Aller sur l'onglet **"Réclamations "**.
    2. Cliquer sur le ticket de réclamation concerné pour l'ouvrir.
    3. Saisir la réponse : *"Après vérification, la diffusion a été décalée au 24 Juillet. Toutes nos excuses."*.
    4. Cliquer sur le bouton **"Marquer comme résolu"**.
*   **Résultat attendu :** La réponse de l'administrateur est enregistrée. Le statut de la réclamation passe de "Ouvert" à "Résolu" (Resolved) en base de données. Lorsque le client se connecte à son espace et consulte son tableau des réclamations, il voit s'afficher le nouveau statut "Résolu" en temps réel ainsi que la réponse de l'administrateur.
*   **Statut :** [ ] Réussi / [ ] Échoué


###  Cas de test 9 : Supervision des conversations de l'IA (Comportement normal)
*   **Prérequis :** Être connecté en tant qu'Administrateur.
*   **Action :** Cliquer sur l'onglet **"Monitoring IA"**.
*   **Résultat attendu :** L'historique de toutes les discussions que les clients ont eues avec le chatbot s'affiche. L'administrateur peut lire les messages échangés pour auditer la qualité des réponses de l'IA.
*   **Statut :** [ ] Réussi / [ ] Échoué



##  SECTION 3 : Rôle Super-Administrateur 

###  Cas de test 10 : Connexion nominale (Comportement normal)

*   **Prérequis :** Compte SuperAdmin créé (`admin@lematin.ma` / `admin123`).
*   **Action :** Se connecter avec `superadmin@lematin.ma` et `admin123`.
*   **Résultat attendu :** Redirection réussie vers le tableau de bord exécutif avec accès aux outils IT et à la configuration globale.
*   **Statut :** [ ] Réussi / [ ] Échoué


###  Cas de test 11 : Création d'un compte Administrateur (Comportement normal)

*   **Prérequis :** Être connecté en tant que Super-Administrateur, sur l'onglet "Gestion des Admins".
*   **Action :** Cliquer sur "Ajouter un Admin", saisir le nom ("IT Support"), l'email (`support.it@lematin.ma`), le mot de passe, puis valider.
*   **Résultat attendu :** Le compte est créé avec le niveau de privilège "Admin", s'affiche dans la liste, et un e-mail automatique SMTP lui est envoyé pour lui transmettre ses accès.
*   **Statut :** [ ] Réussi / [ ] Échoué

###  Cas de test 12 : Configuration globale du LLM (Comportement normal)

*   **Prérequis :** Être connecté en tant que Super-Administrateur et se trouver sur l'onglet "Configuration LLM".
*   **Action :** 
    1. Modifier le champ *Prompt Système* (le comportement de l'IA).
    2. Modifier l'URL du serveur LLM local.
    3. Cliquer sur **"Sauvegarder la configuration"**.
*   **Résultat attendu :** Les nouveaux paramètres système sont enregistrés de façon chiffrée en base de données pour empêcher le vol de clés d'API ou d'URL internes.
*   **Statut :** [ ] Réussi / [ ] Échoué


###  Cas de test 13 : Test de connectivité IA (Comportement normal)

*   **Prérequis :** Être connecté en tant que Super-Administrateur sur l'onglet "Configuration LLM".
*   **Action :** Cliquer sur le bouton **"Tester la connexion IA"**.
*   **Résultat attendu :** Le backend effectue un appel de santé (ping) vers le serveur d'inférence LLM configuré et renvoie une notification de réussite verte : *"Connexion réussie"*.
*   **Statut :** [ ] Réussi / [ ] Échoué


###  Cas de test 14 : Audit des logs système (Comportement normal)

*   **Prérequis :** Être connecté en tant que Super-Administrateur.
*   **Action :** Cliquer sur l'onglet **"Logs Système"**.
*   **Résultat attendu :** Le tableau d'audit de sécurité s'affiche de manière chronologique avec toutes les actions critiques, les adresses IP et l'identité des auteurs des actions.
*   **Statut :** [ ] Réussi / [ ] Échoué


###  Cas de test 15 : Échec de connexion — Mot de passe incorrect (Comportement alternatif)

*   **Prérequis :** Le compte existe en base de données (ex: `client@test.ma`).
*   **Action :** 
    1. Aller sur `http://localhost`.
    2. Saisir l'adresse email correcte `client@test.ma`.
    3. Saisir un mot de passe incorrect (ex: `mauvais_pass_123`).
    4. Cliquer sur le bouton "Se connecter au portail".
*   **Résultat attendu :** L'accès est refusé. Un message d'erreur rouge *"Email ou mot de passe incorrect"* s'affiche à l'écran, le jeton de connexion n'est pas créé et l'utilisateur reste bloqué sur la page de connexion.
*   **Statut :** [ ] Réussi / [ ] Échoué

###  Cas de test 16 : Échec de connexion — Mot de passe incorrect (Comportement alternatif)

*   **Prérequis :** Le compte existe en base de données (ex: `client@test.ma`).
*   **Action :** 
    1. Aller sur `http://localhost`.
    2. Saisir l'adresse email correcte `client@test.ma`.
    3. Saisir un mot de passe incorrect (ex: `mauvais_pass_123`).
    4. Cliquer sur le bouton "Se connecter au portail".
*   **Résultat attendu :** 
    1. L'accès est refusé et le message d'erreur rouge *"Email ou mot de passe incorrect"* s'affiche.
    2. L'utilisateur reste bloqué sur la page de connexion.
    3. **Une ligne d'audit est enregistrée dans les Logs Système** avec l'adresse IP, l'email `client@test.ma` et le type d'événement (Tentative échouée de connexion).
*   **Statut :** [ ] Réussi / [ ] Échoué