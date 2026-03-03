"""
FastAPI application factory and composition root.
Wires routers, middleware, and startup/shutdown resources.
"""

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.api.router import api_router
from app.core.config import settings

app = FastAPI(title="Backend API", version="0.1.0")
app.include_router(api_router, prefix="/api")


@app.get("/health")
def health():
    """Liveness: process is up."""
    return {"status": "ok"}


@app.get("/ready")
async def ready():
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
    try:
        redis = Redis.from_url(settings.redis_url)
        await redis.ping()
        await redis.aclose()
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "checks": {"redis": "fail"}},
        )
    return {"status": "ok", "checks": {"database": "ok", "redis": "ok"}}
