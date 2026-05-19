import re
from playwright.sync_api import Page, expect

# Le nom de la fonction doit commencer par test_



# -------------------------
# LOGIN SUPERADMIN
# -------------------------

def test_login_superadmin(page:Page):
    
    # 1. On dit au navigateur virtuel d'aller sur ta page de login
      
    page.goto("http://localhost:5173/")    
      

    # 2. On trouve le champ email et on le remplit  
    
    page.get_by_placeholder("email").fill("admin@lematin.ma") 
    
     # 3. On trouve le champ mot de passe et on le remplit 
    page.get_by_placeholder("••••••••").fill("admin123")
    
    # 4. On clique sur le bouton de connexion
    # On utilise le texte exact qui est écrit sur le bouton
    page.get_by_role("button", name="Se connecter au portail").click()
    
    # 5. On vérifie que ça a marché
    
    expect(page).to_have_url(re.compile(".*dashboard"), timeout=5000)
    
# -------------------------
# LOGIN ADMIN
# -------------------------   

def test_login_admin(page: Page):
    page.goto("http://localhost:5173/")    
    page.get_by_placeholder("votre@email.com").fill("employe@lematin.ma")
    page.get_by_placeholder("••••••••").fill("admin123")
    
    page.get_by_role("button",
        name="Se connecter au portail"
    ).click()
    
    expect(page).to_have_url(re.compile(".*dashboard"))
    
    
# -------------------------
# LOGIN CLIENT
# -------------------------   

def test_login_client(page: Page):
    page.goto("http://localhost:5173/")    
    page.get_by_placeholder("votre@email.com").fill("client@test.ma")
    page.get_by_placeholder("••••••••").fill("admin123")
    
    page.get_by_role("button",
        name="Se connecter au portail"
    ).click()
    
    expect(page).to_have_url(re.compile(".*dashboard"))  
    
# -------------------------
# MOT DE PASSE INCORRECT
# -------------------------   

def test_login_wrong_password(page: Page):
    page.goto("http://localhost:5173/")    
    page.get_by_placeholder("votre@email.com").fill("client@test.ma")
    page.get_by_placeholder("••••••••").fill("wrongpassword")
    
    page.get_by_role("button",
        name="Se connecter au portail"
    ).click()
    
    expect(page.locator("text=Email ou mot de passe incorrect")) .to_be_visible()   


# -------------------------
# EMAIL INCORRECT
# -------------------------   

def test_login_wrong_email(page: Page):
    page.goto("http://localhost:5173/")    
    page.get_by_placeholder("votre@email.com").fill("fake@fake.ma")
    page.get_by_placeholder("••••••••").fill("wrongpassword")
    
    page.get_by_role("button",
        name="Se connecter au portail"
    ).click()
    
    expect(page.locator("text=Email ou mot de passe incorrect")) .to_be_visible()       
    