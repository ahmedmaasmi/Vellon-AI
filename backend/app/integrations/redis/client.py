"""
Redis connection client and lifecycle management.
"""

from redis.asyncio import Redis

from app.core.config import settings


def create_redis_client() -> Redis:
    """Build an async Redis client from application settings."""
    return Redis.from_url(settings.redis_url)


async def ping_redis(redis: Redis) -> bool:
    """Check Redis connectivity. Returns True if ping succeeds."""
    try:
        await redis.ping()
        return True
    except Exception:
        return False


async def close_redis_client(redis: Redis) -> None:
    """Close the Redis client connection."""
    await redis.aclose()
