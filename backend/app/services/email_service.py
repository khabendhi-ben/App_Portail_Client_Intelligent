import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

# Recharger les variables du fichier .env
load_dotenv()

SMTP_SERVER = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
EMAIL_USER = os.getenv("SMTP_USERNAME", os.getenv("EMAIL_USER", "alienware1881@gmail.com"))
EMAIL_PASSWORD = os.getenv("SMTP_PASSWORD", os.getenv("EMAIL_PASSWORD", "wyzh hslx thfi oeza"))
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Groupe Le Matin")

# Style de base pour les emails
EMAIL_TEMPLATE_BASE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f1f5f9;
            margin: 0;
            padding: 0;
            color: #334155;
        }}
        .email-container {{
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border: 1px solid #e2e8f0;
        }}
        .email-header {{
            background-color: #2e6b6b;
            padding: 30px;
            text-align: center;
        }}
        .email-header h1 {{
            color: #ffffff;
            margin: 0;
            font-size: 1.5rem;
            font-weight: 700;
            letter-spacing: 0.5px;
        }}
        .email-body {{
            padding: 40px 30px;
            line-height: 1.6;
        }}
        .email-body h2 {{
            color: #1e293b;
            font-size: 1.25rem;
            margin-top: 0;
            margin-bottom: 20px;
        }}
        .email-body p {{
            margin-bottom: 20px;
            font-size: 0.95rem;
            color: #475569;
        }}
        .info-box {{
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }}
        .info-item {{
            margin-bottom: 10px;
            font-size: 0.9rem;
        }}
        .info-item:last-child {{
            margin-bottom: 0;
        }}
        .info-label {{
            font-weight: 700;
            color: #334155;
        }}
        .info-value {{
            font-family: monospace;
            background-color: #e2e8f0;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 700;
            color: #0f172a;
            font-size: 0.95rem;
        }}
        .btn {{
            display: inline-block;
            background-color: #2e6b6b;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.9rem;
            text-align: center;
            margin: 20px 0;
            transition: background-color 0.2s;
        }}
        .btn:hover {{
            background-color: #245858;
        }}
        .email-footer {{
            background-color: #f8fafc;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            font-size: 0.8rem;
            color: #94a3b8;
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Groupe Le Matin</h1>
        </div>
        <div class="email-body">
            {content}
        </div>
        <div class="email-footer">
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            <p>&copy; 2026 Groupe Le Matin. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>
"""

def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Envoie un email au format HTML via SMTP Gmail"""
    if not EMAIL_USER or not EMAIL_PASSWORD:
        print("\n[ATTENTION] Configuration email manquante dans .env. Envoi simulé.")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Content: {html_content}\n")
        return False

    try:
        # Création du message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{SMTP_FROM_NAME} <{EMAIL_USER}>"
        message["To"] = to_email

        # Version HTML
        part_html = MIMEText(html_content, "html", "utf-8")
        message.attach(part_html)

        # Connexion au serveur SMTP Gmail
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()  # Sécuriser
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        server.sendmail(EMAIL_USER, to_email, message.as_string())
        server.quit()

        print(f"[SMTP] Email envoyé avec succès à {to_email}")
        return True
    except Exception as e:
        print(f"[SMTP] Erreur lors de l'envoi de l'email à {to_email} : {e}")
        return False


def send_welcome_email(to_email: str, nom: str, temp_password: str, role: str) -> bool:
    """Génère et envoie l'email de bienvenue pour un nouvel utilisateur (client ou admin)"""
    body_content = f"""
    <h2>Bienvenue sur votre portail, {nom} !</h2>
    <p>Votre compte a été créé avec succès sur la plateforme du Groupe Le Matin.</p>
    <p>Voici vos identifiants temporaires pour vous connecter :</p>
    
    <div class="info-box">
        <div class="info-item">
            <span class="info-label">Rôle :</span> {role}
        </div>
        <div class="info-item">
            <span class="info-label">Adresse Email :</span> <span class="info-value">{to_email}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Mot de passe temporaire :</span> <span class="info-value">{temp_password}</span>
        </div>
    </div>
    
    <p style="color: #ef4444; font-weight: bold; font-size: 0.9rem;">
        Pour des raisons de sécurité, vous devez modifier ce mot de passe temporaire lors de votre première connexion.
    </p>
    
    <div style="text-align: center;">
        <a href="http://localhost:5173" class="btn">Se connecter au portail</a>
    </div>
    """
    html = EMAIL_TEMPLATE_BASE.format(content=body_content)
    return send_email(to_email, "Création de votre compte - Groupe Le Matin", html)


def send_reset_email(to_email: str, nom: str, reset_link: str) -> bool:
    """Génère et envoie l'email de réinitialisation pour le client"""
    body_content = f"""
    <h2>Bonjour {nom},</h2>
    <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.</p>
    <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valide pour une durée de 30 minutes.</p>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{reset_link}" class="btn">Réinitialiser mon mot de passe</a>
    </div>
    
    <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité. Votre mot de passe actuel restera inchangé.</p>
    
    <p style="font-size: 0.85rem; color: #94a3b8;">
        Si le bouton ne fonctionne pas, copiez-collez le lien suivant dans votre navigateur :<br>
        <span style="word-break: break-all;">{reset_link}</span>
    </p>
    """
    html = EMAIL_TEMPLATE_BASE.format(content=body_content)
    return send_email(to_email, "Réinitialisation de votre mot de passe", html)


def send_password_reset_notification(to_email: str, nom: str, new_password: str) -> bool:
    """Génère et envoie l'email contenant le nouveau mot de passe généré par le SuperAdmin"""
    body_content = f"""
    <h2>Bonjour {nom},</h2>
    <p>Votre mot de passe a été réinitialisé par l'administrateur.</p>
    <p>Voici vos nouveaux identifiants de connexion :</p>
    
    <div class="info-box">
        <div class="info-item">
            <span class="info-label">Adresse Email :</span> <span class="info-value">{to_email}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Nouveau mot de passe :</span> <span class="info-value">{new_password}</span>
        </div>
    </div>
    
    <p style="color: #ef4444; font-weight: bold; font-size: 0.9rem;">
        Pour des raisons de sécurité, nous vous conseillons de changer ce mot de passe dès votre connexion.
    </p>
    
    <div style="text-align: center;">
        <a href="http://localhost:5173" class="btn">Se connecter au portail</a>
    </div>
    """
    html = EMAIL_TEMPLATE_BASE.format(content=body_content)
    return send_email(to_email, "Votre mot de passe a été réinitialisé", html)
