"""
FastAPI application factory and composition root.
Wires routers, middleware, and startup/shutdown resources.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.api.router import api_router
from app.core.config import settings
from app.integrations.redis.client import close_redis_client, create_redis_client, ping_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage Redis client lifecycle: create at startup, close on shutdown."""
    redis = create_redis_client()
    app.state.redis = redis
    yield
    await close_redis_client(redis)


app = FastAPI(title="Backend API", version="0.1.0", lifespan=lifespan)
app.include_router(api_router, prefix="/api")


@app.get("/health")
def health():
    """Liveness: process is up."""
    return {"status": "ok"}


@app.get("/ready")
async def ready(request: Request):
    """Readiness: DB and Redis are reachable. Returns 503 if either fails."""
    try:
        engine = create_async_engine(settings.database_url)
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        await engine.dispose()
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "checks": {"database": "fail"}},
        )
    redis = request.app.state.redis
    if not await ping_redis(redis):
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "checks": {"redis": "fail"}},
        )
    return {"status": "ok", "checks": {"database": "ok", "redis": "ok"}}
