import os
import shutil
from sqlalchemy.orm import Session
from app.core.database import engine, Base, SessionLocal
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole

def reset_clean_database():
    print("WARNING: Resetting database to a 100% clean production state...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Clean ML models directory
    if os.path.exists(settings.ML_MODELS_DIR):
        for f in os.listdir(settings.ML_MODELS_DIR):
            fpath = os.path.join(settings.ML_MODELS_DIR, f)
            if os.path.isfile(fpath):
                try:
                    os.remove(fpath)
                except Exception:
                    pass
    
    db: Session = SessionLocal()
    try:
        # Create ONLY the single Super Admin account
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
        print(f"Clean database initialized! Exactly 1 Super Admin created: {settings.ADMIN_EMAIL}")
        print("ZERO demo business records exist. Application starts completely fresh at INR 0.")
    except Exception as e:
        db.rollback()
        print(f"Error resetting database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_clean_database()
