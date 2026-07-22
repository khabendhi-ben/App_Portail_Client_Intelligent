from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# 1. Structure de la question envoyée par le Client
class AIChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None # Permet de continuer une discussion existante

# 2. Structure de la réponse renvoyée par le serveur au Client
class AIChatResponse(BaseModel):
    response: str
    conversation_id: int

# 3. Structure d'un message individuel pour l'historique
class AIMessageResponse(BaseModel):
    id: int
    sender: str  # "user" ou "assistant"
    content: str
    timestamp: datetime

    class Config:
        from_attributes = True

# 4. Structure d'une conversation complète pour la barre latérale
class AIConversationResponse(BaseModel):
    id: int
    started_at: datetime
    messages: List[AIMessageResponse] = []

    class Config:
        from_attributes = True

# 5. Structure d'une conversation pour l'administration (avec infos client et nombre de messages)
class AIAdminConversationResponse(BaseModel):
    id: int
    started_at: datetime
    nom_client: Optional[str] = None
    email_client: str
    entreprise_client: Optional[str] = None
    message_count: int

    class Config:
        from_attributes = True

# 6. Configuration LLM
class LLMConfigBase(BaseModel):
    llm_endpoint: str
    llm_api_key: Optional[str] = ""
    llm_model: str
    llm_system_prompt: str

class LLMConfigResponse(LLMConfigBase):
    pass

class LLMConfigUpdate(LLMConfigBase):
    pass

# 7. Statistiques d'utilisation de l'IA (Dashboard)
class AIIntentStat(BaseModel):
    intent: str
    count: int

class AIBoardStatsResponse(BaseModel):
    total_requests: int
    average_response_time_ms: float
    intent_distribution: List[AIIntentStat]