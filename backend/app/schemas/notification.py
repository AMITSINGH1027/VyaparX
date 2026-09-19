from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.notification import NotificationType

class NotificationResponse(BaseModel):
    id: str
    business_id: str
    type: NotificationType
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
