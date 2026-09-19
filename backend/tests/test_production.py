import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.business import Business, BusinessUser
from app.models.product import Product, Category, ProductStatus
from app.models.customer import Customer
from app.models.supplier import Supplier

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_test_environment():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Create Super Admin
    if not db.query(User).filter(User.email == "admin@vyaparx.com").first():
        db.add(User(
            email="admin@vyaparx.com",
            hashed_password=get_password_hash("password123"),
            first_name="Admin",
            last_name="User",
            role=UserRole.SUPER_ADMIN,
            is_active=True,
            is_verified=True
        ))

    # Create Owner 1 & Business 1
    owner1 = db.query(User).filter(User.email == "owner@vyaparx.com").first()
    if not owner1:
        owner1 = User(
            email="owner@vyaparx.com",
            hashed_password=get_password_hash("password123"),
            first_name="Rahul",
            last_name="Sharma",
            role=UserRole.BUSINESS_OWNER,
            is_active=True,
            is_verified=True
        )
        db.add(owner1)
        db.flush()

    b1 = db.query(Business).filter(Business.name == "VyaparX Enterprises Ltd").first()
    if not b1:
        b1 = Business(
            name="VyaparX Enterprises Ltd",
            business_type="Electronics",
            owner_id=owner1.id,
            email="owner@vyaparx.com",
            tax_id_gst="29ABCDE1234F1Z5",
            currency="INR",
            currency_symbol="₹"
        )
        db.add(b1)
        db.flush()
        db.add(BusinessUser(business_id=b1.id, user_id=owner1.id, department="Executive"))

    # Create Employee 1 for Business 1
    emp1 = db.query(User).filter(User.email == "employee@vyaparx.com").first()
    if not emp1:
        emp1 = User(
            email="employee@vyaparx.com",
            hashed_password=get_password_hash("password123"),
            first_name="Amit",
            last_name="Kumar",
            role=UserRole.EMPLOYEE,
            is_active=True,
            is_verified=True
        )
        db.add(emp1)
        db.flush()
        db.add(BusinessUser(business_id=b1.id, user_id=emp1.id, department="Sales"))

    # Create Owner 2 & Business 2 for Multi-Tenant Isolation
    owner2 = db.query(User).filter(User.email == "tenant2@vyaparx.com").first()
    if not owner2:
        owner2 = User(
            email="tenant2@vyaparx.com",
            hashed_password=get_password_hash("password123"),
            first_name="Vikram",
            last_name="Mehta",
            role=UserRole.BUSINESS_OWNER,
            is_active=True,
            is_verified=True
        )
        db.add(owner2)
        db.flush()

    b2 = db.query(Business).filter(Business.name == "PureHarvest Organic Farms").first()
    if not b2:
        b2 = Business(
            name="PureHarvest Organic Farms",
            business_type="Organic Farm",
            owner_id=owner2.id,
            email="support@pureharvest.com",
            tax_id_gst="27XYZAB5678C1Z2"
        )
        db.add(b2)
        db.flush()
        db.add(BusinessUser(business_id=b2.id, user_id=owner2.id, department="Management"))

    db.commit()
    db.close()
    yield

def get_auth_token(email: str, password: str = "password123") -> str:
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]

# 1. Auth & Token Tests
def test_auth_login_and_me(setup_test_environment):
    token = get_auth_token("owner@vyaparx.com")
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "owner@vyaparx.com"
    assert data["role"] == "BUSINESS_OWNER"

def test_auth_wrong_password(setup_test_environment):
    res = client.post("/api/auth/login", json={"email": "owner@vyaparx.com", "password": "wrong_password"})
    assert res.status_code == 401

# 2. RBAC Tests
def test_rbac_super_admin_endpoints(setup_test_environment):
    admin_token = get_auth_token("admin@vyaparx.com")
    res = client.get("/api/admin/platform-stats", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert res.json()["total_businesses"] >= 1

    # Employee attempting super admin endpoint must get 403 Forbidden
    emp_token = get_auth_token("employee@vyaparx.com")
    res_emp = client.get("/api/admin/platform-stats", headers={"Authorization": f"Bearer {emp_token}"})
    assert res_emp.status_code == 403

def test_rbac_employee_permissions(setup_test_environment):
    emp_token = get_auth_token("employee@vyaparx.com")
    # Employee can list sales
    res = client.get("/api/sales/", headers={"Authorization": f"Bearer {emp_token}"})
    assert res.status_code == 200

# 3. Multi-Tenant Data Isolation Tests
def test_multi_tenant_isolation(setup_test_environment):
    token1 = get_auth_token("owner@vyaparx.com")
    token2 = get_auth_token("tenant2@vyaparx.com")

    # Create Product in Business 1
    res1 = client.post("/api/products/", json={
        "name": "Tenant 1 Exclusive Drone",
        "sku": "SKU-T1-DRONE",
        "cost_price": 5000,
        "selling_price": 8000,
        "tax_rate": 18,
        "current_stock": 10,
        "min_stock_alert": 2
    }, headers={"Authorization": f"Bearer {token1}"})
    assert res1.status_code == 200
    p1_id = res1.json()["id"]

    # Business 2 listing products must NOT see Tenant 1's product
    res2 = client.get("/api/products/?search=Exclusive+Drone", headers={"Authorization": f"Bearer {token2}"})
    assert res2.status_code == 200
    items2 = res2.json()["items"]
    assert len(items2) == 0, "Security Violation: Business 2 saw Business 1's product!"

# 4. Inventory, Sales & Atomic Transactions
def test_sales_and_inventory_deduction(setup_test_environment):
    token = get_auth_token("owner@vyaparx.com")

    # Create Product with 20 stock
    p_res = client.post("/api/products/", json={
        "name": "4K Gaming Monitor 144Hz",
        "sku": f"SKU-MON-{pytest.__name__[:4]}",
        "cost_price": 15000,
        "selling_price": 22000,
        "tax_rate": 18,
        "current_stock": 20,
        "min_stock_alert": 5
    }, headers={"Authorization": f"Bearer {token}"})
    assert p_res.status_code == 200
    prod_id = p_res.json()["id"]

    # Create Customer
    c_res = client.post("/api/customers/", json={
        "name": "Nikhil Agarwal",
        "email": "nikhil@example.com",
        "phone": "+91 9899112233"
    }, headers={"Authorization": f"Bearer {token}"})
    assert c_res.status_code == 200
    cust_id = c_res.json()["id"]

    # Sell 3 units
    sale_res = client.post("/api/sales/", json={
        "customer_id": cust_id,
        "items": [{"product_id": prod_id, "quantity": 3, "unit_price": 22000, "discount_rate": 0}],
        "payment_method": "UPI",
        "payment_status": "Paid"
    }, headers={"Authorization": f"Bearer {token}"})
    assert sale_res.status_code == 200
    assert sale_res.json()["grand_total"] == (22000 * 3) * 1.18

    # Verify Product stock decreased from 20 to 17
    prod_updated = client.get(f"/api/products/{prod_id}", headers={"Authorization": f"Bearer {token}"}).json()
    assert prod_updated["current_stock"] == 17

    # Attempt to sell 50 units (more than 17 stock) -> Must Fail with 400
    overflow_res = client.post("/api/sales/", json={
        "customer_id": cust_id,
        "items": [{"product_id": prod_id, "quantity": 50, "unit_price": 22000}],
        "payment_method": "UPI",
        "payment_status": "Paid"
    }, headers={"Authorization": f"Bearer {token}"})
    assert overflow_res.status_code == 400

# 5. Purchases & Stock Replenishment
def test_purchase_order_replenishment(setup_test_environment):
    token = get_auth_token("owner@vyaparx.com")

    # Create Supplier
    s_res = client.post("/api/suppliers/", json={
        "name": "Global Tech Importers",
        "contact_person": "Vikas Shah",
        "email": "vikas@globaltech.com"
    }, headers={"Authorization": f"Bearer {token}"})
    assert s_res.status_code == 200
    supp_id = s_res.json()["id"]

    # Create Product with 5 stock
    p_res = client.post("/api/products/", json={
        "name": "Wireless Mechanical Keyboard",
        "sku": f"SKU-KB-{pytest.__name__[:4]}",
        "cost_price": 2500,
        "selling_price": 4200,
        "tax_rate": 18,
        "current_stock": 5,
        "min_stock_alert": 3
    }, headers={"Authorization": f"Bearer {token}"})
    prod_id = p_res.json()["id"]

    # Execute Purchase of 30 units
    pur_res = client.post("/api/purchases/", json={
        "supplier_id": supp_id,
        "items": [{"product_id": prod_id, "quantity": 30, "unit_cost": 2500, "tax_rate": 18}],
        "payment_status": "Paid"
    }, headers={"Authorization": f"Bearer {token}"})
    assert pur_res.status_code == 200

    # Verify Stock increased from 5 to 35
    prod_check = client.get(f"/api/products/{prod_id}", headers={"Authorization": f"Bearer {token}"}).json()
    assert prod_check["current_stock"] == 35

# 6. Profit & Loss Financial Report
def test_profit_and_loss_arithmetic(setup_test_environment):
    token = get_auth_token("owner@vyaparx.com")
    res = client.get("/api/reports/profit-loss", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    pnl = res.json()
    assert "revenue" in pnl
    assert "cogs" in pnl
    assert "gross_profit" in pnl
    assert "operating_expenses" in pnl
    assert "net_profit" in pnl
    # Verify exact accounting invariant: Gross Profit = Revenue - COGS
    assert round(pnl["gross_profit"], 2) == round(pnl["revenue"] - pnl["cogs"], 2)
    # Verify Net Profit = Gross Profit - Operating Expenses
    assert round(pnl["net_profit"], 2) == round(pnl["gross_profit"] - pnl["operating_expenses"], 2)

# 7. Employee HR & Payroll
def test_employee_hr_workflow(setup_test_environment):
    token = get_auth_token("owner@vyaparx.com")

    # Create Employee
    emp_res = client.post("/api/employees/", json={
        "first_name": "Siddharth",
        "last_name": "Malik",
        "email": "sid.malik@vyaparx.com",
        "phone": "+91 9877001122",
        "designation": "Sales Executive",
        "department": "Retail",
        "base_salary": 30000
    }, headers={"Authorization": f"Bearer {token}"})
    assert emp_res.status_code == 200
    emp_id = emp_res.json()["id"]

    # Log Attendance
    att_res = client.post("/api/employees/attendance/log", json={
        "employee_id": emp_id,
        "date": "2026-08-31",
        "status": "PRESENT",
        "check_in": "09:30 AM"
    }, headers={"Authorization": f"Bearer {token}"})
    assert att_res.status_code == 200
    assert att_res.json()["status"] == "PRESENT"

    # Process Payroll
    pay_res = client.post("/api/employees/payroll/process", json={
        "employee_id": emp_id,
        "month": 8,
        "year": 2026,
        "base_salary": 30000,
        "bonus": 3000,
        "deductions": 1000,
        "payment_method": "Bank Transfer"
    }, headers={"Authorization": f"Bearer {token}"})
    assert pay_res.status_code == 200
    assert pay_res.json()["net_salary"] == 32000

# 8. ML Engines & AI Assistant
def test_ml_and_ai_endpoints(setup_test_environment):
    token = get_auth_token("owner@vyaparx.com")

    # 1. Sales Forecasting
    fore_res = client.get("/api/ml/sales-forecast", headers={"Authorization": f"Bearer {token}"})
    assert fore_res.status_code == 200
    assert "forecast_7d" in fore_res.json()

    # 2. Customer Segmentation
    seg_res = client.get("/api/ml/customer-segments", headers={"Authorization": f"Bearer {token}"})
    assert seg_res.status_code == 200
    assert seg_res.json()["total_segmented"] >= 1

    # 3. AI Assistant Query
    ai_res = client.post("/api/ai/assistant", json={"query": "Which product sold the most?"}, headers={"Authorization": f"Bearer {token}"})
    assert ai_res.status_code == 200
    assert "answer" in ai_res.json()
    assert len(ai_res.json()["answer"]) > 10
