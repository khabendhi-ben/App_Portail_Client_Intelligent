from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

# Définition des rôles
class UserRole(str, enum.Enum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    CLIENT = "client"

class User(Base):
    __tablename__ = "UTILISATEURS"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CLIENT, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relations
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
    user = relationship("User", back_populates="client_profile")

class Announcement(Base):
    __tablename__ = "ANNONCES"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("UTILISATEURS.id"))
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="announcements")

class Claim(Base):
    __tablename__ = "RECLAMATIONS"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("UTILISATEURS.id"))
    subject = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, default="open")
    priority = Column(String, default="normal")
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="claims")

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
    timestamp = Column(DateTime, default=datetime.utcnow)

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
