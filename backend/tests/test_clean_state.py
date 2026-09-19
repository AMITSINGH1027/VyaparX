import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal, Base, engine
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.business import Business
from app.models.product import Product

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def clean_database_fixture():
    # Fresh Database Reset
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Bootstrap Single Super Admin
    db = SessionLocal()
    admin = User(
        email=settings.ADMIN_EMAIL.lower().strip(),
        hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
        first_name=settings.ADMIN_FIRST_NAME,
        last_name=settings.ADMIN_LAST_NAME,
        role=UserRole.SUPER_ADMIN,
        is_active=True,
        is_verified=True
    )
    db.add(admin)
    db.commit()
    db.close()
    yield

# TEST 1: Register User A and verify in Database
def test_1_register_user_a():
    res = client.post("/api/auth/register", json={
        "first_name": "Aarav",
        "last_name": "Sharma",
        "email": "user_a@business.com",
        "phone": "+91 9811001100",
        "password": "PasswordA123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "user_a@business.com"
    assert data["user"]["role"] == "BUSINESS_OWNER"

    # Verify directly in database
    db = SessionLocal()
    user_db = db.query(User).filter(User.email == "user_a@business.com").first()
    assert user_db is not None
    assert user_db.first_name == "Aarav"
    assert user_db.role == UserRole.BUSINESS_OWNER
    db.close()

# TEST 2: Login with User A
def test_2_login_user_a():
    res = client.post("/api/auth/login", json={
        "email": "user_a@business.com",
        "password": "PasswordA123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "user_a@business.com"

# TEST 3: Login with unregistered email must fail
def test_3_login_unregistered_email_fails():
    res = client.post("/api/auth/login", json={
        "email": "random_ghost_user@gmail.com",
        "password": "password123"
    })
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]

# TEST 4 & 5: Multi-Tenant Data Isolation between User A and User B
def test_4_and_5_multi_tenant_isolation():
    # Login User A & Create Business A
    res_a = client.post("/api/auth/login", json={"email": "user_a@business.com", "password": "PasswordA123"})
    token_a = res_a.json()["access_token"]

    biz_a_res = client.post("/api/business/", json={
        "name": "Aarav Tech Retail",
        "business_type": "Electronics",
        "currency": "INR",
        "currency_symbol": "₹"
    }, headers={"Authorization": f"Bearer {token_a}"})
    assert biz_a_res.status_code == 200

    # User A creates a product
    p_res = client.post("/api/products/", json={
        "name": "User A Exclusive Drone Pro",
        "sku": "SKU-UA-DRONE",
        "cost_price": 40000,
        "selling_price": 55000,
        "tax_rate": 18,
        "current_stock": 10,
        "min_stock_alert": 2
    }, headers={"Authorization": f"Bearer {token_a}"})
    assert p_res.status_code == 200
    prod_a_id = p_res.json()["id"]

    # Register User B
    res_b = client.post("/api/auth/register", json={
        "first_name": "Bhavna",
        "last_name": "Patel",
        "email": "user_b@business.com",
        "phone": "+91 9822002200",
        "password": "PasswordB123"
    })
    assert res_b.status_code == 200
    token_b = res_b.json()["access_token"]

    # User B creates Business B
    biz_b_res = client.post("/api/business/", json={
        "name": "Bhavna Organic Grocery",
        "business_type": "Grocery",
        "currency": "INR",
        "currency_symbol": "₹"
    }, headers={"Authorization": f"Bearer {token_b}"})
    assert biz_b_res.status_code == 200

    # User B lists products -> MUST NOT see User A's drone
    b_prods = client.get("/api/products/", headers={"Authorization": f"Bearer {token_b}"}).json()
    assert b_prods["total"] == 0
    assert len(b_prods["items"]) == 0

    # User B trying to access User A's product detail by ID -> MUST return 404
    direct_get = client.get(f"/api/products/{prod_a_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert direct_get.status_code == 404

# TEST 6: Single Super Admin can see platform stats and all businesses
def test_6_super_admin_access():
    res_admin = client.post("/api/auth/login", json={
        "email": "admin@vyaparx.com",
        "password": "admin_secure_password_2026"
    })
    assert res_admin.status_code == 200
    admin_token = res_admin.json()["access_token"]
    assert res_admin.json()["user"]["role"] == "SUPER_ADMIN"

    # Fetch Platform Stats
    stats = client.get("/api/admin/platform-stats", headers={"Authorization": f"Bearer {admin_token}"}).json()
    assert stats["total_users"] >= 2
    assert stats["total_businesses"] >= 2

    # List all businesses
    biz_list = client.get("/api/admin/businesses", headers={"Authorization": f"Bearer {admin_token}"}).json()
    biz_names = [b["name"] for b in biz_list]
    assert "Aarav Tech Retail" in biz_names
    assert "Bhavna Organic Grocery" in biz_names

# TEST 7: Normal users cannot access Admin APIs (403 Forbidden)
def test_7_normal_user_admin_access_rejected():
    res_a = client.post("/api/auth/login", json={"email": "user_a@business.com", "password": "PasswordA123"})
    token_a = res_a.json()["access_token"]

    res_forbidden = client.get("/api/admin/platform-stats", headers={"Authorization": f"Bearer {token_a}"})
    assert res_forbidden.status_code == 403

    res_forbidden_biz = client.get("/api/admin/businesses", headers={"Authorization": f"Bearer {token_a}"})
    assert res_forbidden_biz.status_code == 403

# TEST 8: Anti-Escalation: Role cannot be set to SUPER_ADMIN on public register
def test_8_anti_privilege_escalation():
    res = client.post("/api/auth/register", json={
        "first_name": "Hacker",
        "last_name": "Malicious",
        "email": "hacker@evil.com",
        "password": "HackerPassword123",
        "role": "SUPER_ADMIN"
    })
    assert res.status_code == 200
    user_data = res.json()["user"]
    # Role must be downgraded/enforced to BUSINESS_OWNER
    assert user_data["role"] == "BUSINESS_OWNER"
    assert user_data["role"] != "SUPER_ADMIN"

# TEST 9: Fresh Dashboard starts at exact 0s and empty lists
def test_9_fresh_business_empty_dashboard_kpis():
    res_c = client.post("/api/auth/register", json={
        "first_name": "Clean",
        "last_name": "User",
        "email": "clean_user@business.com",
        "password": "PasswordC123"
    })
    token_c = res_c.json()["access_token"]

    client.post("/api/business/", json={
        "name": "Fresh Clean Enterprises",
        "business_type": "Services"
    }, headers={"Authorization": f"Bearer {token_c}"})

    # Verify Dashboard KPIs are exactly 0
    kpis = client.get("/api/analytics/kpis", headers={"Authorization": f"Bearer {token_c}"}).json()
    assert kpis["revenue"] == 0.0
    assert kpis["net_profit"] == 0.0
    assert kpis["expenses"] == 0.0
    assert kpis["total_sales"] == 0
    assert kpis["total_products"] == 0
    assert kpis["total_customers"] == 0
    assert kpis["low_stock_products"] == 0

    # Verify Top Products & Category Sales are empty
    top_prods = client.get("/api/analytics/top-products", headers={"Authorization": f"Bearer {token_c}"}).json()
    assert top_prods == []

    cat_sales = client.get("/api/analytics/sales-category", headers={"Authorization": f"Bearer {token_c}"}).json()
    assert cat_sales == []

# TEST 10: Persistent CRUD workflow
def test_10_crud_persistence():
    res_c = client.post("/api/auth/login", json={"email": "clean_user@business.com", "password": "PasswordC123"})
    token_c = res_c.json()["access_token"]

    # Create Product
    prod_res = client.post("/api/products/", json={
        "name": "Smart Wireless Earbuds",
        "sku": "SKU-CLEAN-001",
        "cost_price": 1200,
        "selling_price": 2499,
        "tax_rate": 18,
        "current_stock": 25,
        "min_stock_alert": 5
    }, headers={"Authorization": f"Bearer {token_c}"})
    assert prod_res.status_code == 200
    prod_id = prod_res.json()["id"]

    # Verify Product exists in DB
    get_res = client.get(f"/api/products/{prod_id}", headers={"Authorization": f"Bearer {token_c}"})
    assert get_res.status_code == 200
    assert get_res.json()["current_stock"] == 25

    # Update Product
    upd_res = client.put(f"/api/products/{prod_id}", json={
        "selling_price": 2699
    }, headers={"Authorization": f"Bearer {token_c}"})
    assert upd_res.status_code == 200
    assert upd_res.json()["selling_price"] == 2699
