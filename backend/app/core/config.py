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
    refresh_token_expires_days: int = 7
    refresh_cookie_name: str = "refresh_token"
    refresh_cookie_secure: bool = False  # set True in production (HTTPS)

    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/app"
    redis_url: str = "redis://localhost:6379/0"

    # AI (OpenAI). Optional for dev; required for summarize/keywords.
    openai_api_key: str | None = None
    # OpenRouter (embeddings). Backend-only; never expose to frontend.
    openrouter_api_key: str | None = None
    openrouter_embed_model: str = "nvidia/llama-nemotron-embed-vl-1b-v2:free"

    # Cache TTL for AI responses (seconds)
    ai_cache_ttl_seconds: int = 3600

    # Rate limits per plan (AI actions per month)
    rate_limit_ai_free: int = 50
    rate_limit_ai_pro: int = 500
    rate_limit_ai_team: int = 2000

    # Stripe (billing). Webhook secret for signature verification.
    stripe_secret_key: str | None = None
    stripe_webhook_secret: str | None = None

    # Telegram bot. Secret token for webhook verification (X-Telegram-Bot-Api-Secret-Token).
    telegram_bot_token: str | None = None
    telegram_webhook_secret_token: str | None = None

    # Optional multi-tenant
    tenant_header: str | None = "X-Tenant-ID"
    tenant_strategy: str | None = None  # "row" | "schema"


settings = Settings()
