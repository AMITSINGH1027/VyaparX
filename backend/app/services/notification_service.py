from typing import Optional, Tuple

from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationType


def create_notification(
    db: Session,
    business_id: str,
    type: NotificationType,
    title: str,
    message: str,
    link: Optional[str] = None,
    user_id: Optional[str] = None,
    source_type: Optional[str] = None,
    source_id: Optional[str] = None,
) -> Tuple[Notification, bool]:
    """
    Create a notification while preventing duplicate unread
    notifications for the same business/source.

    Returns:
        (notification, created)

        created=True  -> new notification created
        created=False -> existing unread notification returned
    """

    if source_type and source_id:
        existing_notification = (
            db.query(Notification)
            .filter(
                Notification.business_id == business_id,
                Notification.type == type,
                Notification.source_type == source_type,
                Notification.source_id == source_id,
                Notification.is_read.is_(False),
            )
            .first()
        )

        if existing_notification:
            return existing_notification, False

    notification = Notification(
        business_id=business_id,
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        link=link,
        source_type=source_type,
        source_id=source_id,
    )

    db.add(notification)
    db.flush()

    return notification, True


def resolve_notification(
    db: Session,
    business_id: str,
    source_type: str,
    source_id: str,
) -> int:
    """
    Resolve active/unread notifications for a specific source.

    Example:
        Product becomes healthy again:
        PRODUCT_LOW_STOCK -> marked as read.

    Returns:
        Number of notifications resolved.
    """

    updated_count = (
        db.query(Notification)
        .filter(
            Notification.business_id == business_id,
            Notification.source_type == source_type,
            Notification.source_id == source_id,
            Notification.is_read.is_(False),
        )
        .update(
            {"is_read": True},
            synchronize_session=False,
        )
    )

    return updated_count