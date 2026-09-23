import json

from pathlib import Path
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


# VyaparX project root:
# backend/app/core/config.py -> VyaparX/
PROJECT_ROOT = Path(__file__).resolve().parents[3]
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    PROJECT_NAME: str = "VyaparX"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = "sqlite:///./vyaparx.db"

    JWT_SECRET: str = ""
    JWT_REFRESH_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    ADMIN_EMAIL: str = "admin@vyaparx.com"
    ADMIN_PASSWORD: str = ""
    ADMIN_FIRST_NAME: str = "Platform"
    ADMIN_LAST_NAME: str = "Administrator"
    BOOTSTRAP_ADMIN: bool = False

    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: ["http://localhost:5173"]
    )

    ML_MODELS_DIR: str = "./ml_models"

    # ============================================================
    # GOOGLE OAUTH
    # ============================================================

    GOOGLE_CLIENT_ID: str = ""

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        case_sensitive=True,
        extra="ignore",
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, value):
        if value is None or value == "":
            return ["http://localhost:5173"]

        if isinstance(value, list):
            return value

        if isinstance(value, str):
            try:
                parsed = json.loads(value)

                if isinstance(parsed, list):
                    return parsed

            except json.JSONDecodeError:
                pass

            return [
                item.strip()
                for item in value.split(",")
                if item.strip()
            ]

        return value

    @property
    def database_url_for_sqlalchemy(self) -> str:
        url = self.DATABASE_URL.strip()

        if url.startswith("postgres://"):
            return "postgresql+psycopg://" + url[len("postgres://"):]

        if url.startswith("postgresql://"):
            return "postgresql+psycopg://" + url[len("postgresql://"):]

        if url.startswith("postgresql+psycopg://"):
            return url

        return url

    def validate_runtime_config(self) -> None:
        if self.ENVIRONMENT.lower() in {"production", "prod"}:

            if not self.DATABASE_URL.startswith(
                (
                    "postgres://",
                    "postgresql://",
                    "postgresql+psycopg://",
                )
            ):
                raise RuntimeError(
                    "Production requires a PostgreSQL DATABASE_URL"
                )

            if (
                len(self.JWT_SECRET) < 32
                or len(self.JWT_REFRESH_SECRET) < 32
            ):
                raise RuntimeError(
                    "Production JWT secrets must each be at least 32 characters"
                )

            if "*" in self.CORS_ORIGINS:
                raise RuntimeError(
                    "Wildcard CORS is not allowed in production"
                )

            if self.BOOTSTRAP_ADMIN and not self.ADMIN_PASSWORD:
                raise RuntimeError(
                    "ADMIN_PASSWORD must be set when BOOTSTRAP_ADMIN is enabled"
                )


settings = Settings()