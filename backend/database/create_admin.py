"""Create the single platform SUPER_ADMIN from environment variables."""
from app.core.database import SessionLocal
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole


def main() -> None:
    if not settings.BOOTSTRAP_ADMIN:
        print("BOOTSTRAP_ADMIN=false; skipping admin bootstrap")
        return
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
        if existing:
            print("SUPER_ADMIN already exists")
            return
        admin = User(
            email=settings.ADMIN_EMAIL.lower().strip(),
            hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
            first_name=settings.ADMIN_FIRST_NAME,
            last_name=settings.ADMIN_LAST_NAME,
            role=UserRole.SUPER_ADMIN,
            is_active=True,
            is_verified=True,
        )
        db.add(admin)
        db.commit()
        print(f"Created SUPER_ADMIN: {settings.ADMIN_EMAIL}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
