from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_business_id
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    return db.query(Notification).filter(
        Notification.business_id == business_id
    ).order_by(Notification.created_at.desc()).limit(30).all()

@router.put("/mark-all-read", response_model=MessageResponse)
def mark_all_read(
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        Notification.business_id == business_id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return MessageResponse(success=True, message="All notifications marked as read")
