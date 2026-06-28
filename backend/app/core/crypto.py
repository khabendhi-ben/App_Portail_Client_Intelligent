import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

# We expect a 32-byte base64 encoded key
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

def get_fernet():
    if not ENCRYPTION_KEY:
        raise ValueError("ENCRYPTION_KEY n'est pas définie dans le fichier .env")
    return Fernet(ENCRYPTION_KEY.encode())

def encrypt_value(value: str) -> str:
    """Chiffre une chaîne de caractères en texte clair et retourne une chaîne chiffrée."""
    if not value:
        return value
    f = get_fernet()
    return f.encrypt(value.encode()).decode()

def decrypt_value(encrypted_value: str) -> str:
    """Déchiffre une chaîne chiffrée et retourne le texte clair."""
    if not encrypted_value:
        return encrypted_value
    try:
        f = get_fernet()
        return f.decrypt(encrypted_value.encode()).decode()
    except Exception as e:
        # Si le déchiffrement échoue (ex: ancienne valeur non chiffrée ou clé changée)
        # On retourne la valeur d'origine pour éviter de tout casser.
        return encrypted_value
