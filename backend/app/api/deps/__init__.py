"""
Dependency providers for request-scoped objects.
DB session, current user, Redis handle, RBAC.
"""

from __future__ import annotations

import uuid
from typing import Sequence

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import RateLimitExceeded, check_and_increment_ai_usage
from app.core.security import decode_access_token
from app.db.models.note import Note
from app.db.models.user import User
from app.db.repositories import NoteRepository, UserRepository
from app.db.session import get_db_session

security = HTTPBearer(auto_error=True)


def get_redis(request: Request) -> Redis:
    """Provide the application Redis client for dependency injection."""
    redis = getattr(request.app.state, "redis", None)
    if redis is None:
        raise RuntimeError("Redis client not available on app.state")
    return redis


async def get_current_user(
    request: Request,
    session: AsyncSession = Depends(get_db_session),
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """Decode JWT, load user by id; raise 401 if invalid or user not found."""
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        user_id = uuid.UUID(sub)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")

    repo = UserRepository(session)
    user = await repo.get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def require_roles(roles: Sequence[str]):
    """Dependency that requires current user's role to be in the given list; otherwise 403."""

    async def _require(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

    return _require


async def get_note_or_404(
    note_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> Note:
    """Resolve note by id for the current user; raise 404 if not found."""
    repo = NoteRepository(session)
    note = await repo.get_note_by_id(user_id=user.id, note_id=note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


async def get_note_with_tags_or_404(
    note_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> Note:
    """Resolve note by id with tags loaded; raise 404 if not found. Use for GET note response."""
    repo = NoteRepository(session)
    note = await repo.get_note_by_id_with_tags(user_id=user.id, note_id=note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


async def require_ai_rate_limit(
    user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
) -> None:
    """
    Increment user AI usage for the current month and raise 429 if over plan limit.
    Call this on AI endpoints (e.g. summarize, keywords) before performing the action.
    """
    try:
        await check_and_increment_ai_usage(redis, user.id)
    except RateLimitExceeded as e:
        raise HTTPException(
            status_code=429,
            detail=f"AI usage limit exceeded: {e.current} > {e.limit} for this month",
        )
