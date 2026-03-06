"""
Auth service: register (user only), login, refresh token rotation, token issuance.
"""

from __future__ import annotations

import uuid
from uuid import uuid4

from redis.asyncio import Redis

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from app.db.repositories import UserRepository
from app.integrations.redis.cache import delete_cache, set_cache
from app.schemas.auth import TokenResponse

REFRESH_JTI_PREFIX = "refresh:"


class AuthError(Exception):
    """Base for auth-related errors (map to 401/409 in router)."""

    pass


class InvalidCredentialsError(AuthError):
    """Wrong password or user not found."""

    pass


class DuplicateEmailError(AuthError):
    """Email already registered."""

    pass


class AuthService:
    """Orchestrates register, login, and refresh token rotation."""

    def __init__(self, user_repo: UserRepository) -> None:
        self._user_repo = user_repo

    def _refresh_ttl_seconds(self) -> int:
        return settings.refresh_token_expires_days * 86400

    async def _store_refresh_jti(self, redis: Redis, jti: str) -> None:
        await set_cache(
            redis,
            REFRESH_JTI_PREFIX + jti,
            "1",
            ttl_seconds=self._refresh_ttl_seconds(),
        )

    async def _consume_refresh_jti(self, redis: Redis, jti: str) -> bool:
        key = REFRESH_JTI_PREFIX + jti
        from app.integrations.redis.cache import get_cache

        val = await get_cache(redis, key)
        if val is None:
            return False
        await delete_cache(redis, key)
        return True

    async def register(
        self,
        *,
        email: str,
        password: str,
        display_name: str | None = None,
        redis: Redis | None = None,
    ) -> TokenResponse:
        """Create user account, return access and refresh tokens."""
        email_lower = email.strip().lower()
        existing = await self._user_repo.get_by_email(email_lower)
        if existing is not None:
            raise DuplicateEmailError()

        hashed = hash_password(password)
        user = await self._user_repo.create(
            email=email_lower,
            hashed_password=hashed,
            display_name=display_name,
            role="owner",
        )
        access_token = create_access_token(sub=user.id)
        access_expires = settings.access_token_expires_minutes * 60
        refresh_expires = self._refresh_ttl_seconds()
        refresh_token = None
        refresh_expires_in = None
        if redis is not None:
            jti = str(uuid4())
            refresh_token = create_refresh_token(sub=user.id, jti=jti)
            await self._store_refresh_jti(redis, jti)
            refresh_expires_in = refresh_expires
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=access_expires,
            refresh_token=refresh_token,
            refresh_expires_in=refresh_expires_in,
        )

    async def login(
        self,
        *,
        email: str,
        password: str,
        redis: Redis | None = None,
    ) -> TokenResponse:
        """Authenticate user by email + password, return access and refresh tokens."""
        user = await self._user_repo.get_by_email(email.strip().lower())
        if user is None or not verify_password(password, user.hashed_password):
            raise InvalidCredentialsError()

        access_token = create_access_token(sub=user.id)
        access_expires = settings.access_token_expires_minutes * 60
        refresh_token = None
        refresh_expires_in = None
        if redis is not None:
            jti = str(uuid4())
            refresh_token = create_refresh_token(sub=user.id, jti=jti)
            await self._store_refresh_jti(redis, jti)
            refresh_expires_in = self._refresh_ttl_seconds()
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=access_expires,
            refresh_token=refresh_token,
            refresh_expires_in=refresh_expires_in,
        )

    async def refresh_tokens(
        self,
        refresh_token: str,
        redis: Redis,
    ) -> TokenResponse:
        """Validate refresh token, rotate it, return new access and refresh. Raises InvalidCredentialsError if invalid."""
        payload = decode_refresh_token(refresh_token)
        if payload is None:
            raise InvalidCredentialsError()
        jti = payload.get("jti")
        sub = payload.get("sub")
        if not jti or not sub:
            raise InvalidCredentialsError()
        if not await self._consume_refresh_jti(redis, jti):
            raise InvalidCredentialsError()
        user = await self._user_repo.get_by_id(uuid.UUID(sub))
        if user is None:
            raise InvalidCredentialsError()
        access_token = create_access_token(sub=user.id)
        jti_new = str(uuid4())
        new_refresh = create_refresh_token(sub=user.id, jti=jti_new)
        await self._store_refresh_jti(redis, jti_new)
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.access_token_expires_minutes * 60,
            refresh_token=new_refresh,
            refresh_expires_in=self._refresh_ttl_seconds(),
        )
