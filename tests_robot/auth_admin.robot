*** Settings ***
Documentation     Scénario de test automatisé pour l'authentification d'un Administrateur.
Library           SeleniumLibrary

*** Variables ***
${URL}            http://localhost
${BROWSER}        chrome
${ADMIN_EMAIL}    employe@lematin.ma
${PASSWORD}       admin123
${WRONG_PASSWORD}  mauvaispass

*** Test Cases ***
Connexion Réussie En Tant Qu'Administrateur
    [Documentation]    Cas de test 1 : Connexion nominale de l'administrateur
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    Wait Until Page Contains Element    css:input[type="email"]    timeout=5s
    Input Text      css:input[type="email"]    ${ADMIN_EMAIL}
    Input Text      css:input[type="password"]    ${PASSWORD}
    Click Button    css:button[type="submit"]
    Wait Until Location Contains    /admin/dashboard    timeout=5s
    Page Should Contain    Portail Client  # Modifiable selon le contenu de votre dashboard admin
    [Teardown]    Close Browser

Echec De Connexion Avec Mauvais Mot De Passe
    [Documentation]    Cas de test 2 : Connexion rejetée avec mauvais mot de passe
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    Wait Until Page Contains Element    css:input[type="email"]    timeout=5s
    Input Text      css:input[type="email"]    ${ADMIN_EMAIL}
    Input Text      css:input[type="password"]    ${WRONG_PASSWORD}
    Click Button    css:button[type="submit"]
    Wait Until Page Contains    Email ou mot de passe incorrect    timeout=5s
    [Teardown]    Close Browser
