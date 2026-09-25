import pytest
from app.core.security import verify_password, get_password_hash

def test_password_hashing():
    pwd = "SecretPassword123"
    hashed = get_password_hash(pwd)
    assert verify_password(pwd, hashed)
    assert not verify_password("WrongPassword", hashed)

def test_auth_registration_and_login(client):
    reg_payload = {
        "email": "testowner@vyaparx.com",
        "password": "Password123!",
        "first_name": "Test",
        "last_name": "Owner",
        "role": "BUSINESS_OWNER"
    }
    r = client.post("/api/auth/register", json=reg_payload)
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == "testowner@vyaparx.com"

    login_payload = {
        "email": "testowner@vyaparx.com",
        "password": "Password123!"
    }
    r = client.post("/api/auth/login", json=login_payload)
    assert r.status_code == 200
    token = r.json()["access_token"]

    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == "testowner@vyaparx.com"

def test_business_and_products_flow(client):
    r = client.post("/api/auth/login", json={"email": "testowner@vyaparx.com", "password": "Password123!"})
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    biz_payload = {
        "name": "Test Retailers",
        "business_type": "Electronics",
        "email": "biz@test.com",
        "country": "India",
        "currency": "INR",
        "currency_symbol": "₹"
    }
    r = client.post("/api/business/", json=biz_payload, headers=headers)
    assert r.status_code == 200

    prod_payload = {
        "name": "Mechanical Keyboard Pro",
        "sku": "KB-TEST-001",
        "cost_price": 2000.0,
        "selling_price": 3500.0,
        "tax_rate": 18.0,
        "current_stock": 25,
        "min_stock_alert": 5,
        "unit": "units"
    }
    r = client.post("/api/products/", json=prod_payload, headers=headers)
    assert r.status_code == 200
    prod = r.json()
    prod_id = prod["id"]

    sale_payload = {
        "items": [
            {
                "product_id": prod_id,
                "quantity": 3,
                "discount_rate": 0.0
            }
        ],
        "payment_method": "UPI",
        "payment_status": "Paid"
    }
    r = client.post("/api/sales/", json=sale_payload, headers=headers)
    assert r.status_code == 200
    sale_data = r.json()
    assert sale_data["invoice_number"].startswith("INV-")
    assert sale_data["grand_total"] > 0

    r = client.get(f"/api/products/{prod_id}", headers=headers)
    assert r.status_code == 200
    assert r.json()["current_stock"] == 22

    r = client.get("/api/analytics/kpis", headers=headers)
    assert r.status_code == 200
    kpis = r.json()
    assert kpis["total_sales_count"] == 1
    assert kpis["revenue"] > 0
