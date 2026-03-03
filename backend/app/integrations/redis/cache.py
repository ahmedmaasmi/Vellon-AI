"""
Redis cache abstraction (get/set/delete, TTL).
"""

from redis.asyncio import Redis


async def set_cache(
    redis: Redis,
    key: str,
    value: str,
    ttl_seconds: int | None = None,
) -> None:
    """Store a string value at key. Optionally set TTL in seconds."""
    if ttl_seconds is not None:
        await redis.set(key, value, ex=ttl_seconds)
    else:
        await redis.set(key, value)


async def get_cache(redis: Redis, key: str) -> str | None:
    """Return the string value at key, or None if missing."""
    value = await redis.get(key)
    if value is None:
        return None
    return value.decode("utf-8") if isinstance(value, bytes) else value


async def increment_counter(
    redis: Redis,
    key: str,
    amount: int = 1,
    ttl_seconds: int | None = None,
) -> int:
    """Increment the integer at key by amount. Optionally set TTL in seconds. Returns new value."""
    new_value = await redis.incrby(key, amount)
    if ttl_seconds is not None:
        await redis.expire(key, ttl_seconds)
    return new_value
