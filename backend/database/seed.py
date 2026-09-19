import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.database import engine, SessionLocal, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.business import Business, BusinessUser
from app.models.product import Product, Category, ProductStatus
from app.models.inventory import InventoryMovement, MovementType
from app.models.customer import Customer, CustomerSegment, ChurnRiskLevel
from app.models.supplier import Supplier
from app.models.sale import Sale, SaleItem, PaymentMethod, PaymentStatus
from app.models.purchase import Purchase, PurchaseItem
from app.models.expense import Expense, ExpenseCategory
from app.models.notification import Notification, NotificationType
from app.ml.pipeline_manager import train_all_models

def seed_database():
    print("Initializing Database schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    random.seed(42)

    print("Creating Users & Business...")
    owner = User(
        email="owner@vyaparx.com",
        hashed_password=get_password_hash("password123"),
        first_name="Rahul",
        last_name="Sharma",
        phone="+91 9876543210",
        role=UserRole.BUSINESS_OWNER,
        is_active=True,
        is_verified=True
    )
    db.add(owner)

    admin = User(
        email="admin@vyaparx.com",
        hashed_password=get_password_hash("password123"),
        first_name="System",
        last_name="Administrator",
        phone="+91 9999988888",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
        is_verified=True
    )
    db.add(admin)

    manager = User(
        email="manager@vyaparx.com",
        hashed_password=get_password_hash("password123"),
        first_name="Priya",
        last_name="Verma",
        phone="+91 9812345678",
        role=UserRole.MANAGER,
        is_active=True,
        is_verified=True
    )
    db.add(manager)

    employee = User(
        email="employee@vyaparx.com",
        hashed_password=get_password_hash("password123"),
        first_name="Amit",
        last_name="Kumar",
        phone="+91 9723456789",
        role=UserRole.EMPLOYEE,
        is_active=True,
        is_verified=True
    )
    db.add(employee)

    accountant = User(
        email="accountant@vyaparx.com",
        hashed_password=get_password_hash("password123"),
        first_name="Ananya",
        last_name="Iyer",
        phone="+91 9634567890",
        role=UserRole.MANAGER,
        is_active=True,
        is_verified=True
    )
    db.add(accountant)
    db.flush()

    business = Business(
        name="VyaparX Enterprises Ltd",
        business_type="Retail & Wholesale Electronics",
        owner_id=owner.id,
        email="contact@vyaparx-demo.com",
        phone="+91 11 4567 8900",
        address="Tower B, Tech Innovation Park, Sector 62",
        city="Noida",
        state="Uttar Pradesh",
        country="India",
        tax_id_gst="07AAAAA0000A1Z5",
        logo_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
        currency="INR",
        currency_symbol="₹",
        timezone="Asia/Kolkata",
        allow_negative_stock="false"
    )
    db.add(business)
    db.flush()

    # Link employees to business
    for u, dept in [(manager, "Operations"), (employee, "Sales"), (accountant, "Finance")]:
        db.add(BusinessUser(business_id=business.id, user_id=u.id, department=dept))

    print("Creating Categories...")
    category_names = ["Laptops & Computers", "Smartphones & Tablets", "Audio & Headphones", "Computer Accessories", "Office Supplies", "Networking & Smart Devices"]
    categories = []
    for cname in category_names:
        cat = Category(business_id=business.id, name=cname, description=f"Premium {cname} catalog")
        db.add(cat)
        categories.append(cat)
    db.flush()

    print("Creating 20 Suppliers...")
    supplier_names = [
        "TechSource Wholesale Distributors", "Apex Microelectronics India", "Silicon Valley Components",
        "NextGen Digital Logistics", "Prime Supplies Corp", "Quantum Hardware Ltd", "Delta Peripheral Imports",
        "Omni Electronics Hub", "Starlight Gadgets", "Zenith Commercial Distributors",
        "Hyperion Trade Co.", "Vanguard Logistics", "Matrix Devices Pvt", "Pinnacle Office Gear",
        "Horizon Tech Suppliers", "Velocity Electronics", "Benchmark Distribution", "Crestview Tech",
        "BlueChip Global Ltd", "Metro Smart Imports"
    ]
    suppliers = []
    for sname in supplier_names:
        sup = Supplier(
            business_id=business.id,
            name=sname,
            contact_person=f"Mr. {sname.split()[0]} Sharma",
            email=f"sales@{sname.lower().replace(' ', '')[:10]}.com",
            phone=f"+91 98{random.randint(10000000, 99999999)}",
            address="Commercial Complex Phase 2",
            city="New Delhi",
            tax_id=f"07{random.randint(10000000, 99999999)}A1Z"
        )
        db.add(sup)
        suppliers.append(sup)
    db.flush()

    print("Creating 100 Products...")
    product_templates = [
        ("ProBook Ultrabook 14", 0, "HP", 42000, 56000, 18.0, 35),
        ("ThinkStation Mini PC", 0, "Lenovo", 31000, 41500, 18.0, 20),
        ("Gaming Laptop RTX 4060", 0, "Asus", 68000, 89900, 18.0, 15),
        ("MacBook Air M2 Space Gray", 0, "Apple", 75000, 94900, 18.0, 12),
        ("All-in-One Touch PC 24-inch", 0, "Dell", 48000, 62000, 18.0, 18),
        ("Galaxy Tab S9 128GB", 1, "Samsung", 38000, 49999, 18.0, 25),
        ("iPad Pro 11-inch WiFi", 1, "Apple", 62000, 79900, 18.0, 20),
        ("Smart Phone 5G Ultra", 1, "OnePlus", 28000, 37999, 18.0, 40),
        ("Pixel 8 Pro Hazel", 1, "Google", 54000, 69999, 18.0, 15),
        ("Redmi Note Pro Max", 1, "Xiaomi", 14500, 19999, 18.0, 50),
        ("Noise Cancelling Wireless Headphones", 2, "Sony", 12500, 18990, 18.0, 45),
        ("True Wireless Earbuds ANC", 2, "JBL", 3500, 5499, 18.0, 60),
        ("Studio Monitor Speakers Pair", 2, "Yamaha", 16000, 22500, 18.0, 10),
        ("Bluetooth Portable Speaker 20W", 2, "Marshall", 8500, 12999, 18.0, 30),
        ("Gaming Headset 7.1 Surround", 2, "Razer", 4200, 6499, 18.0, 40),
        ("Ergonomic Wireless Mouse", 3, "Logitech", 1800, 2999, 18.0, 85),
        ("Mechanical RGB Keyboard", 3, "Keychron", 4500, 7200, 18.0, 50),
        ("USB-C Dual 4K Docking Station", 3, "Anker", 6200, 9499, 18.0, 30),
        ("27-inch 4K IPS Monitor", 3, "LG", 19500, 26900, 18.0, 22),
        ("Full HD 1080p Streaming Webcam", 3, "Logitech", 3200, 4999, 18.0, 45),
        ("Heavy Duty Laser Printer", 4, "Canon", 11000, 15999, 18.0, 14),
        ("Executive Ergonomic Mesh Chair", 4, "GreenSoul", 8200, 12499, 18.0, 20),
        ("Motorized Standing Desk Frame", 4, "ErgoSmart", 14000, 21999, 18.0, 8),
        ("A4 Copier Paper 75GSM 5 Reams", 4, "JK Copier", 1100, 1550, 12.0, 120),
        ("Document Shredder Cross-Cut", 4, "Fellowes", 4500, 6999, 18.0, 15),
        ("WiFi 6 Gigabit Mesh Router", 5, "TP-Link", 5200, 7999, 18.0, 35),
        ("24-Port Managed PoE Switch", 5, "Cisco", 18500, 25900, 18.0, 10),
        ("Cat6 High Speed Patch Cable 10m", 5, "D-Link", 250, 499, 18.0, 150),
        ("Smart Security Camera 2K WiFi", 5, "Mi", 1800, 2899, 18.0, 40),
        ("Network Attached Storage 2-Bay", 5, "Synology", 22000, 31500, 18.0, 8)
    ]

    products = []
    idx = 1
    for base_name, cat_idx, brand, cost, sell, tax, stock in product_templates:
        for variation in ["Standard", "Pro Edition", "Enterprise Pack", "Compact"]:
            if idx > 100:
                break
            vname = f"{base_name} ({variation})" if variation != "Standard" else base_name
            vsku = f"SKU-{cat_idx+1:02d}-{idx:04d}"
            vstock = max(4, stock + random.randint(-8, 20))
            vcost = cost * (1.0 if variation == "Standard" else (1.2 if variation == "Pro Edition" else (1.4 if variation == "Enterprise Pack" else 0.9)))
            vsell = sell * (1.0 if variation == "Standard" else (1.2 if variation == "Pro Edition" else (1.4 if variation == "Enterprise Pack" else 0.9)))

            prod = Product(
                business_id=business.id,
                category_id=categories[cat_idx].id,
                supplier_id=random.choice(suppliers).id,
                name=vname,
                sku=vsku,
                brand=brand,
                description=f"High quality {vname} from {brand}. Covered by 1-year warranty.",
                cost_price=round(vcost, 2),
                selling_price=round(vsell, 2),
                tax_rate=tax,
                current_stock=vstock,
                min_stock_alert=random.choice([8, 10, 15, 20]),
                max_stock_capacity=500,
                unit="units",
                status=ProductStatus.ACTIVE
            )
            db.add(prod)
            products.append(prod)
            idx += 1
    db.flush()

    print("Creating 50 Customers...")
    indian_names = [
        "Aditya Roy", "Rajesh Patel", "Sneha Mukherjee", "Vikram Rathore", "Kavita Reddy",
        "Deepak Nair", "Pooja Hegde", "Siddharth Jain", "Meera Sen", "Manoj Kulkarni",
        "Sunita Bansal", "Arjun Kapoor", "Neha Singhal", "Gaurav Mehta", "Shweta Tiwari",
        "Rohit Deshmukh", "Poonam Gupta", "Tarun Bhasin", "Rashmi Bose", "Kunal Saxena",
        "Swati Bhatt", "Naveen Chawla", "Bhavna Joshi", "Harish Pillai", "Ritu Agrawal",
        "Varun Dhawan", "Divya Menon", "Sanjay Rao", "Ananya Pandey", "Ashish Grover",
        "Shruti Nambiar", "Manish Malhotra", "Kiran Mazumdar", "Pranav Anand", "Geeta Phogat",
        "Rakesh Jhunjhun", "Pallavi Joshi", "Vivek Agnihotri", "Shalini Pandey", "Devendra Fadnavis",
        "Tanvi Shah", "Rohan Gavaskar", "Alka Yagnik", "Udit Narayan", "Shreya Ghoshal",
        "Sonu Nigam", "Sunidhi Chauhan", "Arijit Singh", "Harshdeep Kaur", "Diljit Dosanjh"
    ]
    customers = []
    for cname in indian_names:
        c_email = f"{cname.lower().replace(' ', '.')}@example.com"
        cust = Customer(
            business_id=business.id,
            name=cname,
            email=c_email,
            phone=f"+91 98{random.randint(10000000, 99999999)}",
            address=f"Flat {random.randint(101, 909)}, Green Heights Residency",
            city=random.choice(["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Pune", "Noida", "Chennai"]),
            total_spent=0.0,
            order_count=0,
            outstanding_balance=0.0,
            rfm_segment=CustomerSegment.REGULAR,
            churn_risk=ChurnRiskLevel.LOW
        )
        db.add(cust)
        customers.append(cust)
    db.flush()

    print("Generating 200 Purchases (Stock Inflows)...")
    now = datetime.now(timezone.utc)
    for i in range(1, 201):
        p_date = now - timedelta(days=random.randint(1, 180), hours=random.randint(0, 23))
        sup = random.choice(suppliers)
        po_num = f"PO-2026-{i:05d}"
        
        num_items = random.randint(2, 5)
        chosen_prods = random.sample(products, num_items)
        subtotal = 0.0
        tax_total = 0.0
        po_items = []

        for prod in chosen_prods:
            qty = random.randint(5, 25)
            item_base = prod.cost_price * qty
            item_tax = item_base * (prod.tax_rate / 100.0)
            subtotal += item_base
            tax_total += item_tax

            po_items.append(PurchaseItem(
                product_id=prod.id,
                product_name=prod.name,
                quantity=qty,
                unit_cost=prod.cost_price,
                tax_rate=prod.tax_rate,
                total_cost=round(item_base + item_tax, 2)
            ))

        grand = round(subtotal + tax_total, 2)
        po = Purchase(
            business_id=business.id,
            supplier_id=sup.id,
            purchase_number=po_num,
            purchase_date=p_date,
            subtotal=round(subtotal, 2),
            tax_amount=round(tax_total, 2),
            discount_amount=0.0,
            grand_total=grand,
            paid_amount=grand,
            payment_status=PaymentStatus.PAID,
            notes="Regular stock replenishment order",
            created_by_user_id=manager.id,
            items=po_items
        )
        db.add(po)
        sup.total_purchases_amount += grand
    db.flush()

    print("Generating 500 Historical Sales over past 6 months...")
    payment_methods = [PaymentMethod.UPI, PaymentMethod.CARD, PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER]
    for i in range(1, 501):
        days_ago = random.randint(1, 180)
        s_date = now - timedelta(days=days_ago, hours=random.randint(8, 20), minutes=random.randint(0, 59))
        cust = random.choice(customers)
        inv_num = f"INV-2026-{i:05d}"

        num_items = random.choices([1, 2, 3, 4], weights=[40, 35, 15, 10])[0]
        chosen_prods = random.sample(products, num_items)
        subtotal = 0.0
        tax_total = 0.0
        sale_items = []

        for prod in chosen_prods:
            qty = random.choices([1, 2, 3], weights=[70, 20, 10])[0]
            disc_rate = random.choice([0.0, 5.0, 10.0])
            item_base = prod.selling_price * qty
            disc_val = item_base * (disc_rate / 100.0)
            taxable = item_base - disc_val
            item_tax = taxable * (prod.tax_rate / 100.0)
            item_tot = taxable + item_tax

            subtotal += taxable
            tax_total += item_tax

            sale_items.append(SaleItem(
                product_id=prod.id,
                product_name=prod.name,
                quantity=qty,
                unit_price=prod.selling_price,
                unit_cost=prod.cost_price,
                discount_rate=disc_rate,
                tax_rate=prod.tax_rate,
                total_price=round(item_tot, 2)
            ))

        overall_disc = random.choice([0.0, 100.0, 250.0, 500.0]) if subtotal > 5000 else 0.0
        grand = round(subtotal + tax_total - overall_disc, 2)

        sale = Sale(
            business_id=business.id,
            customer_id=cust.id,
            invoice_number=inv_num,
            sale_date=s_date,
            subtotal=round(subtotal, 2),
            discount_amount=round(overall_disc, 2),
            tax_amount=round(tax_total, 2),
            grand_total=grand,
            paid_amount=grand,
            payment_method=random.choice(payment_methods),
            payment_status=PaymentStatus.PAID,
            notes="Store counter sale",
            created_by_user_id=employee.id,
            items=sale_items
        )
        db.add(sale)

        cust.total_spent += grand
        cust.order_count += 1
        if not cust.last_purchase_date or s_date > cust.last_purchase_date.replace(tzinfo=timezone.utc):
            cust.last_purchase_date = s_date
    db.flush()

    print("Generating 100 Operating Expenses...")
    expense_defs = [
        (ExpenseCategory.RENT, "Commercial Showroom Rent", 65000, 30),
        (ExpenseCategory.SALARY, "Staff Monthly Payroll", 120000, 30),
        (ExpenseCategory.ELECTRICITY, "Commercial Power & AC Bill", 14500, 30),
        (ExpenseCategory.INTERNET, "High-Speed Fiber Lease Line", 3500, 30),
        (ExpenseCategory.MARKETING, "Google & Meta Ads Campaign", 18000, 15),
        (ExpenseCategory.MAINTENANCE, "Store IT Equipment Servicing", 4500, 45),
        (ExpenseCategory.OFFICE_SUPPLIES, "Stationery and Packaging Boxes", 6200, 20),
        (ExpenseCategory.TRANSPORT, "Customer Delivery & Freight", 8500, 10)
    ]

    for cat, desc, base_amt, freq_days in expense_defs:
        for d in range(10, 181, freq_days):
            e_date = now - timedelta(days=d, hours=10)
            exp = Expense(
                business_id=business.id,
                category=cat,
                description=desc,
                amount=round(base_amt * (1 + random.uniform(-0.1, 0.15)), 2),
                payment_method=PaymentMethod.BANK_TRANSFER,
                expense_date=e_date,
                notes=f"Processed expense for {desc}",
                created_by_user_id=accountant.id
            )
            db.add(exp)
    db.flush()

    print("Generating Notifications...")
    db.add(Notification(
        business_id=business.id,
        type=NotificationType.LOW_STOCK,
        title="Low Stock Alert",
        message="5 products are running low on stock. Please review reorders.",
        link="/inventory"
    ))
    db.add(Notification(
        business_id=business.id,
        type=NotificationType.SALES_MILESTONE,
        title="Sales Milestone Achieved",
        message="Congratulations! Total revenue crossed ₹10,00,000 this quarter!",
        link="/analytics"
    ))
    db.add(Notification(
        business_id=business.id,
        type=NotificationType.CHURN_RISK,
        title="Customer Retention Alert",
        message="4 high-value customers have become inactive for over 60 days.",
        link="/customers"
    ))

    db.commit()
    print("Database seeded with realistic business data!")

    print("Training ML models on seeded data...")
    res = train_all_models(db, business.id)
    print("ML Models successfully trained:", res)

    db.close()

if __name__ == "__main__":
    seed_database()
