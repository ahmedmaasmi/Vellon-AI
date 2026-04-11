"""
Application settings and environment configuration.
Load from env / .env; keep secrets out of code.
"""

from typing import Any

from pydantic import Field, field_validator
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

    # CORS: comma-separated origins in env, e.g. "http://localhost:3000,https://app.example.com"
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        if v is None or v == "":
            return ["http://localhost:3000", "http://127.0.0.1:3000"]
        if isinstance(v, list):
            return [str(x).strip() for x in v if str(x).strip()]
        if isinstance(v, str):
            return [p.strip() for p in v.split(",") if p.strip()]
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    # OpenRouter (chat + embeddings). Backend-only; never expose to frontend.
    openrouter_api_key: str | None = None
    openrouter_chat_model: str = "openai/gpt-4o-mini"
    openrouter_embed_model: str = "nvidia/llama-nemotron-embed-vl-1b-v2:free"

    # Cache TTL for AI responses (seconds)
    ai_cache_ttl_seconds: int = 3600

    # Voice media (local disk). In Docker, mount a volume at this path.
    media_root: str = "/app/media"

    # ElevenLabs (STT / TTS / speech-to-speech). Backend-only; never expose to frontend.
    elevenlabs_api_key: str | None = None
    elevenlabs_stt_model: str = "scribe_v2"
    elevenlabs_tts_voice_id: str = "JBFqnCBsd6RMkjVDRZzb"
    elevenlabs_tts_model: str = "eleven_multilingual_v2"
    elevenlabs_sts_model: str = "eleven_multilingual_sts_v2"
    # Max upload size for voice memo original audio (bytes)
    voice_upload_max_bytes: int = 25 * 1024 * 1024
    # Max upload size for note image attachments (bytes)
    note_image_upload_max_bytes: int = 10 * 1024 * 1024

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
