"""
Security primitives: password hashing, JWT access/refresh tokens, token validation.
"""

from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Refresh token payload type
REFRESH_TOKEN_TYPE = "refresh"


def hash_password(plain: str) -> str:
    """Hash a plaintext password with bcrypt."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return pwd_context.verify(plain, hashed)


def create_access_token(*, sub: UUID | str) -> str:
    """Create a signed JWT access token. Claims: sub (user id), exp, iat."""
    now = datetime.now(UTC)
    expire = now + timedelta(minutes=settings.access_token_expires_minutes)
    payload = {
        "sub": str(sub),
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


def create_refresh_token(
    *,
    sub: UUID | str,
    jti: str | None = None,
) -> str:
    """Create a signed JWT refresh token. jti (id) is used for revocation/rotation."""
    now = datetime.now(UTC)
    expire = now + timedelta(days=settings.refresh_token_expires_days)
    payload = {
        "sub": str(sub),
        "jti": jti or str(uuid4()),
        "type": REFRESH_TOKEN_TYPE,
        "exp": expire,
        "iat": now,
    }
    return jwt.encode(
        payload,
        settings.secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_refresh_token(token: str) -> dict | None:
    """Decode and validate refresh JWT. Returns payload or None. Caller must check type=='refresh'."""
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        if payload.get("type") != REFRESH_TOKEN_TYPE:
            return None
        return payload
    except jwt.PyJWTError:
        return None
