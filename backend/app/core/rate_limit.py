"""
Redis-based rate limiting per user/org/plan.
"""

from __future__ import annotations

import uuid
from calendar import monthrange
from datetime import UTC, datetime

from redis.asyncio import Redis

from app.core.config import settings
from app.integrations.redis.cache import increment_counter, get_cache

USAGE_AI_PREFIX = "usage:ai:"


def _month_window() -> tuple[str, int]:
    """Return (YYYY-MM, ttl_seconds until end of month)."""
    now = datetime.now(UTC)
    year, month = now.year, now.month
    key_suffix = f"{year}-{month:02d}"
    _, last_day = monthrange(year, month)
    end = datetime(year, month, last_day, 23, 59, 59, tzinfo=UTC)
    ttl = int((end - now).total_seconds()) + 1
    return key_suffix, max(ttl, 1)


def _limit_for_plan(plan: str) -> int:
    if plan == "pro":
        return settings.rate_limit_ai_pro
    if plan == "team":
        return settings.rate_limit_ai_team
    return settings.rate_limit_ai_free


async def check_and_increment_ai_usage(
    redis: Redis,
    organization_id: uuid.UUID,
    plan: str,
) -> None:
    """
    Increment AI usage counter for the org for the current month.
    Raises RateLimitExceeded if the new value exceeds the plan limit.
    """
    suffix, ttl = _month_window()
    key = f"{USAGE_AI_PREFIX}{organization_id}:{suffix}"
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
    organization_id: uuid.UUID,
) -> int:
    """Return current AI usage count for the org this month (from Redis)."""
    suffix, _ = _month_window()
    key = f"{USAGE_AI_PREFIX}{organization_id}:{suffix}"
    raw = await get_cache(redis, key)
    if raw is None:
        return 0
    try:
        return int(raw)
    except ValueError:
        return 0
