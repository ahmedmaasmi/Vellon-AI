"""
Application settings and environment configuration.
Load from env / .env; keep secrets out of code.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    debug: bool = True
    secret_key: str = "change-me-in-production"

    # JWT
    jwt_algorithm: str = "HS256"
    access_token_expires_minutes: int = 60

    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/app"
    redis_url: str = "redis://localhost:6379/0"

    # Optional multi-tenant
    tenant_header: str | None = "X-Tenant-ID"
    tenant_strategy: str | None = None  # "row" | "schema"


settings = Settings()
