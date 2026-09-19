from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.expense import ExpenseCategory
from app.models.sale import PaymentMethod

class ExpenseCreate(BaseModel):
    category: ExpenseCategory
    description: str
    amount: float = Field(gt=0)
    payment_method: PaymentMethod = PaymentMethod.CASH
    expense_date: Optional[datetime] = None
    receipt_url: Optional[str] = None
    notes: Optional[str] = None

class ExpenseUpdate(BaseModel):
    category: Optional[ExpenseCategory] = None
    description: Optional[str] = None
    amount: Optional[float] = Field(gt=0, default=None)
    payment_method: Optional[PaymentMethod] = None
    expense_date: Optional[datetime] = None
    receipt_url: Optional[str] = None
    notes: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: str
    business_id: str
    category: ExpenseCategory
    description: str
    amount: float
    payment_method: PaymentMethod
    expense_date: datetime
    receipt_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
