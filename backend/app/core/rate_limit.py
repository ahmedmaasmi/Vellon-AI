"""
Redis-based rate limiting per user (AI usage per month).
"""

from __future__ import annotations

import uuid
from calendar import monthrange
from datetime import UTC, datetime

from redis.asyncio import Redis

from app.core.config import settings
from app.integrations.redis.cache import get_cache, increment_counter

USAGE_AI_PREFIX = "usage:ai:"


def normalize_plan(plan: str | None) -> str:
    """Map stored plan to quota tier: free | pro | team."""
    p = (plan or "free").strip().lower()
    if p in ("pro", "team"):
        return p
    return "free"


def _month_window() -> tuple[str, int, datetime]:
    """Return (YYYY-MM, ttl_seconds until end of month, period_end datetime)."""
    now = datetime.now(UTC)
    year, month = now.year, now.month
    key_suffix = f"{year}-{month:02d}"
    _, last_day = monthrange(year, month)
    period_end = datetime(year, month, last_day, 23, 59, 59, tzinfo=UTC)
    ttl = int((period_end - now).total_seconds()) + 1
    return key_suffix, max(ttl, 1), period_end


def _limit_for_plan(plan: str) -> int:
    if plan == "pro":
        return settings.rate_limit_ai_pro
    if plan == "team":
        return settings.rate_limit_ai_team
    return settings.rate_limit_ai_free


async def check_and_increment_ai_usage(
    redis: Redis,
    user_id: uuid.UUID,
    plan: str = "free",
) -> None:
    """
    Increment AI usage counter for the user for the current month.
    Raises RateLimitExceeded if the new value exceeds the plan limit.
    """
    suffix, ttl, _ = _month_window()
    key = f"{USAGE_AI_PREFIX}{user_id}:{suffix}"
    new_value = await increment_counter(redis, key, amount=1, ttl_seconds=ttl)
    limit = _limit_for_plan(plan)
    if new_value > limit:
        raise RateLimitExceeded(limit=limit, current=new_value)


class RateLimitExceeded(Exception):
    """Raised when per-plan AI usage limit is exceeded."""

    def __init__(self, *, limit: int, current: int) -> None:
        self.limit = limit
        self.current = current
        super().__init__(f"AI usage limit exceeded: {current} > {limit}")


async def get_ai_usage_current_month(
    redis: Redis,
    user_id: uuid.UUID,
) -> int:
    """Return current AI usage count for the user this month (from Redis)."""
    suffix, _, _ = _month_window()
    key = f"{USAGE_AI_PREFIX}{user_id}:{suffix}"
    raw = await get_cache(redis, key)
    if raw is None:
        return 0
    try:
        return int(raw)
    except ValueError:
        return 0


def get_limit_for_plan(plan: str) -> int:
    """Return AI actions per month limit for the given plan."""
    return _limit_for_plan(plan)


async def get_quota_metadata(
    redis: Redis,
    user_id: uuid.UUID,
    plan: str = "free",
) -> dict:
    """
    Return quota metadata for the user: plan, limit, used, remaining, reset_period_end (ISO).
    Used for frontend display and plan-based enforcement consistency.
    """
    _, _, period_end = _month_window()
    used = await get_ai_usage_current_month(redis, user_id)
    limit = _limit_for_plan(plan)
    remaining = max(0, limit - used)
    return {
        "plan": plan,
        "limit": limit,
        "used": used,
        "remaining": remaining,
        "reset_period_end": period_end.isoformat(),
    }
