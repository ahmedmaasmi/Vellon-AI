"""
Auth service: register (org + owner), login (tenant-scoped), refresh token rotation, token issuance.
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
from app.db.repositories import OrganizationRepository, UserRepository
from app.integrations.redis.cache import delete_cache, set_cache
from app.schemas.auth import TokenResponse

REFRESH_JTI_PREFIX = "refresh:"


class AuthError(Exception):
    """Base for auth-related errors (map to 401/409 in router)."""

    pass


class InvalidCredentialsError(AuthError):
    """Wrong password or user not found in tenant."""

    pass


class DuplicateOrganizationSlugError(AuthError):
    """Organization slug already taken."""

    pass


class AuthService:
    """Orchestrates register, login, and refresh token rotation."""

    def __init__(
        self,
        organization_repo: OrganizationRepository,
        user_repo: UserRepository,
    ) -> None:
        self._org_repo = organization_repo
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
        organization_name: str,
        organization_slug: str,
        email: str,
        password: str,
        display_name: str | None = None,
        redis: Redis | None = None,
    ) -> TokenResponse:
        """Create organization and owner user, return access and refresh tokens."""
        slug = organization_slug.strip().lower()
        existing = await self._org_repo.get_by_slug(slug)
        if existing is not None:
            raise DuplicateOrganizationSlugError()

        org = await self._org_repo.create(name=organization_name, slug=slug)
        hashed = hash_password(password)
        user = await self._user_repo.create(
            organization_id=org.id,
            email=email.strip().lower(),
            hashed_password=hashed,
            display_name=display_name,
            role="owner",
        )
        access_token = create_access_token(
            sub=user.id,
            org_id=org.id,
            org_slug=org.slug or slug,
        )
        access_expires = settings.access_token_expires_minutes * 60
        refresh_expires = self._refresh_ttl_seconds()
        refresh_token = None
        refresh_expires_in = None
        if redis is not None:
            jti = str(uuid4())
            refresh_token = create_refresh_token(
                sub=user.id,
                org_id=org.id,
                jti=jti,
            )
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
        organization_slug: str,
        email: str,
        password: str,
        redis: Redis | None = None,
    ) -> TokenResponse:
        """Authenticate user in tenant, return access and refresh tokens."""
        slug = organization_slug.strip().lower()
        org = await self._org_repo.get_by_slug(slug)
        if org is None:
            raise InvalidCredentialsError()

        user = await self._user_repo.get_by_organization_and_email(
            org.id, email.strip().lower()
        )
        if user is None or not verify_password(password, user.hashed_password):
            raise InvalidCredentialsError()

        access_token = create_access_token(
            sub=user.id,
            org_id=org.id,
            org_slug=org.slug or slug,
        )
        access_expires = settings.access_token_expires_minutes * 60
        refresh_token = None
        refresh_expires_in = None
        if redis is not None:
            jti = str(uuid4())
            refresh_token = create_refresh_token(
                sub=user.id,
                org_id=org.id,
                jti=jti,
            )
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
        org_id = payload.get("org")
        if not jti or not sub or not org_id:
            raise InvalidCredentialsError()
        if not await self._consume_refresh_jti(redis, jti):
            raise InvalidCredentialsError()
        user = await self._user_repo.get_by_id(uuid.UUID(sub))
        if user is None or str(user.organization_id) != org_id:
            raise InvalidCredentialsError()
        org = await self._org_repo.get_by_id(user.organization_id)
        if org is None:
            raise InvalidCredentialsError()
        access_token = create_access_token(
            sub=user.id,
            org_id=org.id,
            org_slug=org.slug or "",
        )
        jti_new = str(uuid4())
        new_refresh = create_refresh_token(sub=user.id, org_id=org.id, jti=jti_new)
        await self._store_refresh_jti(redis, jti_new)
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.access_token_expires_minutes * 60,
            refresh_token=new_refresh,
            refresh_expires_in=self._refresh_ttl_seconds(),
        )
