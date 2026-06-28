#Couche "Données" (ORM). 
# Définit la structure des tables SQL 
# sous forme de classes Python (ex: user_model.py).
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Enum, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

# Définition des rôles
class UserRole(str, enum.Enum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    CLIENT = "client"

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True)
    nom = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)

class User(Base):
    __tablename__ = "UTILISATEURS"
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), default=2, nullable=False)
    is_active = Column(Boolean, default=True)
    must_change_password = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Propriété de compatibilité pour le rôle sous forme de texte
    @property
    def role(self):
        mapping = {0: "superadmin", 1: "admin", 2: "client"}
        return mapping.get(self.role_id, "client")

    @role.setter
    def role(self, value):
        val_str = str(value).lower().split('.')[-1]
        mapping = {"superadmin": 0, "admin": 1, "client": 2}
        self.role_id = mapping.get(val_str, 2)

    # Relations
    role_relation = relationship("Role")
    client_profile = relationship("Client", back_populates="user", uselist=False)
    claims = relationship("Claim", back_populates="user")
    announcements = relationship("Announcement", back_populates="user")
    ai_conversations = relationship("AIConversation", back_populates="user")

class Client(Base):
    __tablename__ = "CLIENTS"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("UTILISATEURS.id"), unique=True)
    company_name = Column(String, nullable=False)
    phone = Column(String)
    address = Column(Text)
    subscription_type = Column(String, default="Standard")
    budget = Column(Float, default=0.0, nullable=True)
    user = relationship("User", back_populates="client_profile")

class Announcement(Base):
    __tablename__ = "ANNONCES"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("UTILISATEURS.id"))
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    status = Column(String, default="pending")
    budget = Column(Float, default=0.0, nullable=True)
    type = Column(String, default="Bannière", nullable=True)
    support = Column(String, default="Le Matin", nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="announcements")

    @property
    def reference(self):
        import hashlib
        if not self.id:
            return None
        h = hashlib.md5(str(self.id).encode()).hexdigest()[:13]
        return f"cmd-{h}/{self.user_id}"

class Claim(Base):
    __tablename__ = "RECLAMATIONS"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("UTILISATEURS.id"))
    announcement_id = Column(Integer, ForeignKey("ANNONCES.id"), nullable=True)
    subject = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, default="open")
    priority = Column(String, default="normal")
    admin_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="claims")
    announcement = relationship("Announcement")

    @property
    def reference(self):
        return f"REC-{self.id:05d}" if self.id else None

    @property
    def client_name(self):
        return self.user.nom if self.user else None

    @property
    def client_company(self):
        return self.user.client_profile.company_name if (self.user and self.user.client_profile) else None

    @property
    def announcement_ref(self):
        return self.announcement.reference if self.announcement else None

    @property
    def announcement_title(self):
        return self.announcement.title if self.announcement else None


class AIConversation(Base):
    __tablename__ = "IA_CONVERSATIONS"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("UTILISATEURS.id"))
    started_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="ai_conversations")
    messages = relationship("AIMessage", back_populates="conversation")

class AIMessage(Base):
    __tablename__ = "IA_MESSAGES"
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("IA_CONVERSATIONS.id"))
    sender = Column(String)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    conversation = relationship("AIConversation", back_populates="messages")

class SystemLog(Base):
    __tablename__ = "LOGS_SYSTEM"
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("UTILISATEURS.id"), nullable=True)
    details = Column(Text)
    ip_address = Column(String, nullable=True)
    severity = Column(String, default="INFO") # INFO, WARNING, ERROR
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class ConfigurationLLM(Base):
    __tablename__ = "CONFIGURATION_LLM"
    id = Column(Integer, primary_key=True, index=True)
    key_name = Column(String, unique=True, nullable=False)
    value = Column(String, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# NOUVELLE TABLE POUR LE SPRINT 1 (US-005)
class PasswordResetRequest(Base):
    __tablename__ = "PASSWORD_RESETS"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False)
    status = Column(String, default="en_attente") # en_attente, traité
    created_at = Column(DateTime, default=datetime.utcnow)
