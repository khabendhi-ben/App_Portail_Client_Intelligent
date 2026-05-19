import secrets
import string
from jose import JWTError, jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional

# Configuration (À mettre en .env plus tard)
SECRET_KEY = "VOTRE_CLE_SECRET_TRES_LONGUE_ET_SECURISEE_GROUPE_LE_MATIN"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password, hashed_password):
    """Vérifie le mot de passe"""
    password_byte = plain_password.encode('utf-8')
    hashed_byte = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_byte, hashed_byte)

def get_password_hash(password):
    """Génère un hachage bcrypt"""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def generate_random_password(length=12):
    """Génère un mot de passe aléatoire pour le SuperAdmin"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for i in range(length))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Génère un Token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
