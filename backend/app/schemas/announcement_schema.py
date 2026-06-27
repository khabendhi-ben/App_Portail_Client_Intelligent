from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AnnouncementResponse(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    status: str
    budget: Optional[float] = 0.0
    type: Optional[str] = "Bannière"
    support: Optional[str] = "Le Matin"
    reference: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AnnouncementPaginationResponse(BaseModel):
    items: List[AnnouncementResponse]
    total: int
    page: int
    limit: int
    pages: int
