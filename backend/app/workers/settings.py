"""
ARQ worker settings and task registration.
Run with: arq app.workers.settings.WorkerSettings
"""

from __future__ import annotations

from arq import create_pool
from arq.connections import RedisSettings

from app.core.config import settings


async def example_task(ctx: dict, message: str) -> str:
    """Example background task: echo message. Replace with speech transcription, AI, etc."""
    return f"Processed: {message}"


async def startup(ctx: dict) -> None:
    """Worker startup: add shared resources to context (e.g. DB pool, Redis)."""
    from app.integrations.redis.client import create_redis_client

    ctx["redis"] = create_redis_client()


async def shutdown(ctx: dict) -> None:
    """Worker shutdown: close resources."""
    redis = ctx.get("redis")
    if redis is not None:
        from app.integrations.redis.client import close_redis_client

        await close_redis_client(redis)


class WorkerSettings:
    """ARQ worker configuration. Used by: arq app.workers.settings.WorkerSettings"""

    functions = [example_task]
    on_startup = startup
    on_shutdown = shutdown

    redis_settings = RedisSettings.from_dsn(settings.redis_url)


async def enqueue_job(job_name: str, *args: object, **kwargs: object):
    """
    Enqueue a job from the API (e.g. from a route or service).
    Use from async context: await enqueue_job('example_task', 'hello').
    """
    redis = await create_pool(RedisSettings.from_dsn(settings.redis_url))
    try:
        return await redis.enqueue_job(job_name, *args, **kwargs)
    finally:
        await redis.close()
