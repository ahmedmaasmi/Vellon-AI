"""
Security primitives: password hashing, JWT, token validation.
"""

from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    """Hash a plaintext password with bcrypt."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return pwd_context.verify(plain, hashed)


def create_access_token(
    *,
    sub: UUID | str,
    org_id: UUID | str,
    org_slug: str,
) -> str:
    """Create a signed JWT access token. Claims: sub (user id), org (org id), org_slug, exp, iat."""
    now = datetime.now(UTC)
    expire = now + timedelta(minutes=settings.access_token_expires_minutes)
    payload = {
        "sub": str(sub),
        "org": str(org_id),
        "org_slug": org_slug,
        "exp": expire,
        "iat": now,
    }
    return jwt.encode(
        payload,
        settings.secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> dict | None:
    """
    Decode and validate JWT. Returns payload dict or None if invalid/expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except jwt.PyJWTError:
        return None
