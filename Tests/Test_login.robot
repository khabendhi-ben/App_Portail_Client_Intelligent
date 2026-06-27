*** Settings ***
Documentation     Fichier de test de connexion pour le Portail Client
Library          Browser    # Charge Playwright pour Robot Framework

*** Test Cases ***
Connexion SuperAdmin Reussie
# -----------------------------
# 1. TEST : CONNEXION SUPERADMIN
# -----------------------------

    # Notez l'indentation (4 espaces ou 1 Tabulation) au début des lignes ci-dessous
    New Browser    browser=chromium    headless=False
    New Page       http://localhost:5173/login

    # On écrit tout sur la même ligne avec au moins 2 espaces entre chaque élément
        Fill Text      input[type="email"]       Superadmin@lematin.ma
    Fill Text      input[type="password"]    admin123

    Take Screenshot    filename=Superadmin_saisie

    Click          button[type="submit"]

    Wait For Condition    Url    contains    dashboard    timeout=5s
    Take Screenshot    filename=Superadmin_dashb_ok
    Close Browser




*** Test Cases ***
Connexion Admin Reussie
# -----------------------------
# 1. TEST : CONNEXION ADMIN
# -----------------------------

    New Browser    browser=chromium    headless=False
    New Page       http://localhost:5173/login

    Fill Text    input[type="email"]    admin@lematin.ma
    Fill Text    input[type="password"]    admin123
    take Screenshot     filename=admin_saisie

    Click    button[type="submit"]

    Wait For Condition    Url    contains    admin/dashboard    timeout=5s

    take Screenshot    filename=admin_dashb_ok

    Close Browser


*** Test Cases ***
Connexion Client Reussie
# -----------------------------
# 1. TEST : CONNEXION Client
# -----------------------------    


