"""
Middleware: rate limiting / throttling (Redis-backed).
"""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Redis-backed global rate limit by IP (e.g. 300 req/min per IP).
    Uses app.state.redis; key: rl:ip:{ip}:{minute} with configurable limit.
    """

    def __init__(self, app, *, requests_per_minute: int = 300):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute

    async def dispatch(self, request: Request, call_next):
        redis = getattr(request.app.state, "redis", None)
        if redis is None:
            return await call_next(request)
        client_host = request.client.host if request.client else "unknown"
        from datetime import UTC, datetime

        now = datetime.now(UTC)
        window = now.strftime("%Y-%m-%d-%H-%M")
        key = f"rl:ip:{client_host}:{window}"
        try:
            new_val = await redis.incr(key)
            if new_val == 1:
                await redis.expire(key, 60)
            if new_val > self.requests_per_minute:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests"},
                )
        except Exception:
            pass
        return await call_next(request)
