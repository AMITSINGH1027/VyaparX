from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationType

def create_notification(
    db: Session,
    business_id: str,
    type: NotificationType,
    title: str,
    message: str,
    link: str = None,
    user_id: str = None
) -> Notification:
    notif = Notification(
        business_id=business_id,
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        link=link
    )
    db.add(notif)
    db.flush()
    return notif
