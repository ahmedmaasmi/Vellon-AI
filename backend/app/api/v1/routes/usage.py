"""
Usage and quota routes: plan-based limits and metadata for the current user.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_redis
from app.core.rate_limit import get_quota_metadata
from app.db.models.user import User
from app.db.session import get_db_session
from app.schemas.usage import QuotaResponse

router = APIRouter(prefix="/usage", tags=["usage"])


@router.get("/quota", response_model=QuotaResponse)
async def get_quota(
    user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
) -> QuotaResponse:
    """Return AI quota metadata for the current user (plan, limit, used, remaining, reset)."""
    metadata = await get_quota_metadata(redis, user.id, plan="free")
    return QuotaResponse(**metadata)
