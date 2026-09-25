from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_business_id, RoleChecker
from app.models.user import User, UserRole
from app.models.expense import Expense, ExpenseCategory
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.schemas.common import PaginatedResponse, MessageResponse

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.get("/", response_model=PaginatedResponse[ExpenseResponse])
def list_expenses(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[ExpenseCategory] = None,
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    query = db.query(Expense).filter(Expense.business_id == business_id)
    if category:
        query = query.filter(Expense.category == category)

    total = query.count()
    items = query.order_by(Expense.expense_date.desc()).offset((page - 1) * limit).limit(limit).all()
    pages = (total + limit - 1) // limit
    return PaginatedResponse(items=items, total=total, page=page, limit=limit, pages=pages)

@router.post("/", response_model=ExpenseResponse)
def create_expense(
    exp_in: ExpenseCreate,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    expense = Expense(
        business_id=business_id,
        category=exp_in.category,
        description=exp_in.description,
        amount=exp_in.amount,
        payment_method=exp_in.payment_method,
        expense_date=exp_in.expense_date or datetime.now(timezone.utc),
        receipt_url=exp_in.receipt_url,
        notes=exp_in.notes,
        created_by_user_id=current_user.id
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

@router.delete("/{id}", response_model=MessageResponse)
def delete_expense(
    id: str,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER])),
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(Expense.id == id, Expense.business_id == business_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return MessageResponse(success=True, message="Expense deleted")
