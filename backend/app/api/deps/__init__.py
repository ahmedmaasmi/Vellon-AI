"""
Dependency providers for request-scoped objects.
DB session, current tenant, current user, Redis handle.
"""

from fastapi import Request
from redis.asyncio import Redis


def get_redis(request: Request) -> Redis:
    """Provide the application Redis client for dependency injection."""
    redis = getattr(request.app.state, "redis", None)
    if redis is None:
        raise RuntimeError("Redis client not available on app.state")
    return redis
