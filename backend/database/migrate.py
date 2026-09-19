"""Run database migrations for the current DATABASE_URL."""
from pathlib import Path
from alembic import command
from alembic.config import Config


def main() -> None:
    base = Path(__file__).resolve().parents[1]
    cfg = Config(str(base / "alembic.ini"))
    command.upgrade(cfg, "head")


if __name__ == "__main__":
    main()
