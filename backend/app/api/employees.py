from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_business_id, RoleChecker, get_current_user
from app.models.user import User, UserRole
from app.models.employee import Employee, Attendance, AttendanceStatus, Payroll, PayrollStatus
from app.models.expense import Expense
from app.schemas.employee import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse,
    AttendanceCreate, AttendanceResponse,
    PayrollCreate, PayrollResponse
)
from app.schemas.common import MessageResponse, PaginatedResponse
from app.services.audit_service import log_activity

router = APIRouter(prefix="/employees", tags=["Employees & HR"])

@router.get("/", response_model=PaginatedResponse[EmployeeResponse])
def list_employees(
    page: int = Query(1, ge=1),
    limit: int = Query(30, ge=1, le=100),
    search: Optional[str] = None,
    department: Optional[str] = None,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    query = db.query(Employee).filter(Employee.business_id == business_id)
    if search:
        s = f"%{search}%"
        query = query.filter((Employee.first_name.ilike(s)) | (Employee.last_name.ilike(s)) | (Employee.email.ilike(s)))
    if department:
        query = query.filter(Employee.department == department)

    total = query.count()
    items = query.order_by(Employee.first_name.asc()).offset((page - 1) * limit).limit(limit).all()
    pages = (total + limit - 1) // limit
    return PaginatedResponse(items=items, total=total, page=page, limit=limit, pages=pages)

@router.post("/", response_model=EmployeeResponse)
def create_employee(
    emp_in: EmployeeCreate,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    emp = Employee(
        business_id=business_id,
        first_name=emp_in.first_name,
        last_name=emp_in.last_name,
        email=emp_in.email,
        phone=emp_in.phone,
        designation=emp_in.designation,
        department=emp_in.department,
        base_salary=emp_in.base_salary,
        joining_date=emp_in.joining_date or date.today()
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)

    log_activity(
        db=db,
        business_id=business_id,
        action="CREATE_EMPLOYEE",
        resource_type="Employee",
        resource_id=emp.id,
        user_id=current_user.id,
        details=f"Created employee record for {emp.full_name}"
    )

    return emp

@router.put("/{id}", response_model=EmployeeResponse)
def update_employee(
    id: str,
    emp_in: EmployeeUpdate,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == id, Employee.business_id == business_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    for field, val in emp_in.model_dump(exclude_unset=True).items():
        setattr(emp, field, val)

    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp

@router.delete("/{id}", response_model=MessageResponse)
def delete_employee(
    id: str,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER])),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == id, Employee.business_id == business_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(emp)
    db.commit()
    return MessageResponse(success=True, message=f"Employee '{emp.full_name}' deleted")

@router.get("/attendance/today", response_model=List[AttendanceResponse])
def get_today_attendance(
    target_date: Optional[date] = None,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    d = target_date or date.today()
    attendances = db.query(Attendance).filter(Attendance.business_id == business_id, Attendance.date == d).all()
    results = []
    for att in attendances:
        resp = AttendanceResponse.model_validate(att)
        resp.employee_name = att.employee.full_name if att.employee else None
        results.append(resp)
    return results

@router.post("/attendance/log", response_model=AttendanceResponse)
def log_attendance(
    att_in: AttendanceCreate,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    existing = db.query(Attendance).filter(
        Attendance.business_id == business_id,
        Attendance.employee_id == att_in.employee_id,
        Attendance.date == att_in.date
    ).first()

    if existing:
        existing.status = att_in.status
        existing.check_in = att_in.check_in
        existing.check_out = att_in.check_out
        existing.notes = att_in.notes
        db.add(existing)
        db.commit()
        db.refresh(existing)
        resp = AttendanceResponse.model_validate(existing)
        resp.employee_name = existing.employee.full_name if existing.employee else None
        return resp

    att = Attendance(
        business_id=business_id,
        employee_id=att_in.employee_id,
        date=att_in.date,
        status=att_in.status,
        check_in=att_in.check_in,
        check_out=att_in.check_out,
        notes=att_in.notes
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    resp = AttendanceResponse.model_validate(att)
    resp.employee_name = att.employee.full_name if att.employee else None
    return resp

@router.get("/payroll/history", response_model=List[PayrollResponse])
def get_payroll_history(
    month: Optional[int] = None,
    year: Optional[int] = None,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    query = db.query(Payroll).filter(Payroll.business_id == business_id)
    if month:
        query = query.filter(Payroll.month == month)
    if year:
        query = query.filter(Payroll.year == year)

    items = query.order_by(Payroll.created_at.desc()).all()
    results = []
    for p in items:
        resp = PayrollResponse.model_validate(p)
        resp.employee_name = p.employee.full_name if p.employee else None
        results.append(resp)
    return results

@router.post("/payroll/process", response_model=PayrollResponse)
def process_payroll(
    pay_in: PayrollCreate,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER])),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == pay_in.employee_id, Employee.business_id == business_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    net = pay_in.base_salary + pay_in.bonus - pay_in.deductions

    payroll = Payroll(
        business_id=business_id,
        employee_id=emp.id,
        month=pay_in.month,
        year=pay_in.year,
        base_salary=pay_in.base_salary,
        bonus=pay_in.bonus,
        deductions=pay_in.deductions,
        net_salary=net,
        status=PayrollStatus.PAID,
        payment_method=pay_in.payment_method,
        payment_date=date.today(),
        notes=pay_in.notes
    )
    db.add(payroll)

    salary_exp = Expense(
        business_id=business_id,
        category="Salary",
        description=f"Salary disbursement for {emp.full_name} ({pay_in.month}/{pay_in.year})",
        amount=net,
        payment_method=pay_in.payment_method,
        created_by_user_id=current_user.id
    )
    db.add(salary_exp)
    db.commit()
    db.refresh(payroll)

    log_activity(
        db=db,
        business_id=business_id,
        action="PROCESS_PAYROLL",
        resource_type="Payroll",
        resource_id=payroll.id,
        user_id=current_user.id,
        details=f"Disbursed salary ₹{net:,} to {emp.full_name}"
    )

    resp = PayrollResponse.model_validate(payroll)
    resp.employee_name = emp.full_name
    return resp
