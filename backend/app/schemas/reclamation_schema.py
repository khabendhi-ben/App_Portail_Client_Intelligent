from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReclamationCreate(BaseModel):
    subject: str
    description: str
    priority: str = "normal"
    announcement_id: Optional[int] = None

class ReclamationResponse(BaseModel):
    id: int
    user_id: int
    subject: str
    description: str
    status: str
    priority: str
    reference: Optional[str] = None
    admin_response: Optional[str] = None
    client_name: Optional[str] = None
    client_company: Optional[str] = None
    announcement_id: Optional[int] = None
    announcement_ref: Optional[str] = None
    announcement_title: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReclamationRespond(BaseModel):
    admin_response: str
    status: str
