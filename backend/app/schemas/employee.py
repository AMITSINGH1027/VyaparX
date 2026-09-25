from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.employee import AttendanceStatus, PayrollStatus

class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    designation: str = "Staff"
    department: str = "Sales"
    base_salary: float = 25000.0
    joining_date: Optional[date] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    base_salary: Optional[float] = None
    is_active: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    business_id: str
    is_active: str
    created_at: datetime

class AttendanceCreate(BaseModel):
    employee_id: str
    date: date
    status: AttendanceStatus = AttendanceStatus.PRESENT
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    notes: Optional[str] = None

class AttendanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    employee_id: str
    date: date
    status: AttendanceStatus
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    notes: Optional[str] = None
    employee_name: Optional[str] = None

class PayrollCreate(BaseModel):
    employee_id: str
    month: int
    year: int
    base_salary: float
    bonus: float = 0.0
    deductions: float = 0.0
    payment_method: str = "Bank Transfer"
    notes: Optional[str] = None

class PayrollResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    employee_id: str
    month: int
    year: int
    base_salary: float
    bonus: float
    deductions: float
    net_salary: float
    status: PayrollStatus
    payment_method: str
    payment_date: date
    notes: Optional[str] = None
    employee_name: Optional[str] = None
