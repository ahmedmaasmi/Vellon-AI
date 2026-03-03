"""
Redis pub/sub for events and task signaling (real-time translation, live updates).
"""

from __future__ import annotations

import json
from typing import Any, AsyncIterator

from redis.asyncio import Redis

from app.core.config import settings


async def publish(redis: Redis, channel: str, message: dict[str, Any] | str) -> int:
    """
    Publish a message to a channel. Returns number of subscribers that received it.
    Message is JSON-encoded if dict.
    """
    if isinstance(message, dict):
        payload = json.dumps(message)
    else:
        payload = message
    return await redis.publish(channel, payload)


async def subscribe(
    redis: Redis,
    *channels: str,
) -> AsyncIterator[tuple[str, str]]:
    """
    Subscribe to channels and yield (channel, message) until connection is closed.
    Use as: async for ch, msg in subscribe(redis, "notes:updates"): ...
    """
    pubsub = redis.pubsub()
    try:
        await pubsub.subscribe(*channels)
        async for message in pubsub.listen():
            if message["type"] == "message":
                yield message["channel"].decode() if isinstance(message["channel"], bytes) else message["channel"], (
                    message["data"].decode() if isinstance(message["data"], bytes) else message["data"]
                )
    finally:
        await pubsub.unsubscribe(*channels)
        await pubsub.close()


def get_redis_url() -> str:
    """Return Redis URL from settings (for worker/standalone use)."""
    return settings.redis_url
