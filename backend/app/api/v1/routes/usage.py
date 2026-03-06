"""
Usage and quota routes: plan-based limits and metadata for the current organization.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_redis
from app.core.rate_limit import get_quota_metadata
from app.db.models.user import User
from app.db.repositories import OrganizationRepository
from app.db.session import get_db_session
from app.schemas.usage import QuotaResponse

router = APIRouter(prefix="/usage", tags=["usage"])


@router.get("/quota", response_model=QuotaResponse)
async def get_quota(
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
) -> QuotaResponse:
    """Return AI quota metadata for the current user's organization (plan, limit, used, remaining, reset)."""
    org_repo = OrganizationRepository(session)
    org = await org_repo.get_by_id(user.organization_id)
    if org is None:
        raise HTTPException(status_code=403, detail="Organization not found")
    metadata = await get_quota_metadata(redis, org.id, org.plan)
    return QuotaResponse(**metadata)
