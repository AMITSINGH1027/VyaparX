from sqlalchemy.orm import Session
from app.models.audit import AuditLog

def log_activity(
    db: Session,
    business_id: str,
    action: str,
    resource_type: str,
    resource_id: str = None,
    user_id: str = None,
    ip_address: str = None,
    details: str = None
):
    try:
        entry = AuditLog(
            business_id=business_id,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            details=details
        )
        db.add(entry)
        db.flush()
    except Exception as e:
        # Avoid crashing main transaction on audit log failure
        print(f"Failed to write audit log: {e}")
