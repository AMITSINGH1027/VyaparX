from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_business_id, RoleChecker
from app.models.user import UserRole
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogResponse
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/audit", tags=["Audit Trail"])

@router.get("/", response_model=PaginatedResponse[AuditLogResponse])
def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(30, ge=1, le=100),
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    business_id: str = Depends(get_current_business_id),
    current_user = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog).filter(AuditLog.business_id == business_id)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)

    total = query.count()
    items = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    enriched = []
    for item in items:
        resp = AuditLogResponse.model_validate(item)
        resp.user_name = item.user.full_name if item.user else "System"
        enriched.append(resp)

    pages = (total + limit - 1) // limit
    return PaginatedResponse(items=enriched, total=total, page=page, limit=limit, pages=pages)
