"""
OpenRouter-based embeddings service. Backend-only; API key never exposed to frontend.
"""

from __future__ import annotations

import json
import uuid

import httpx
from redis.asyncio import Redis

from app.core.config import settings
from app.integrations.redis.cache import get_cache, set_cache


OPENROUTER_EMBED_URL = "https://openrouter.ai/api/v1/embeddings"


class OpenRouterNotConfiguredError(Exception):
    """OpenRouter API key is not configured."""

    pass


def _cache_key_embedding(note_id: uuid.UUID) -> str:
    return f"embedding:{note_id}"


async def get_cached_embedding(
    redis: Redis,
    note_id: uuid.UUID,
) -> tuple[list[float], int] | None:
    """Return (embedding vector, dimension) from cache, or None."""
    raw = await get_cache(redis, _cache_key_embedding(note_id))
    if raw is None:
        return None
    try:
        data = json.loads(raw)
        vec = data.get("embedding")
        dim = data.get("dimension")
        if isinstance(vec, list) and isinstance(dim, int):
            return (vec, dim)
        return None
    except (json.JSONDecodeError, TypeError):
        return None


async def set_cached_embedding(
    redis: Redis,
    note_id: uuid.UUID,
    embedding: list[float],
    ttl_seconds: int | None = None,
) -> None:
    """Store embedding in cache as JSON."""
    ttl = ttl_seconds if ttl_seconds is not None else settings.ai_cache_ttl_seconds
    payload = json.dumps({"embedding": embedding, "dimension": len(embedding)})
    await set_cache(redis, _cache_key_embedding(note_id), payload, ttl_seconds=ttl)


async def generate_embedding(text: str) -> tuple[list[float], int]:
    """
    Generate embedding for text via OpenRouter. Raises OpenRouterNotConfiguredError if key not set.
    Returns (embedding vector, dimension).
    """
    if not settings.openrouter_api_key:
        raise OpenRouterNotConfiguredError("OpenRouter API key not configured")

    payload = {
        "model": settings.openrouter_embed_model,
        "input": text[:8192] if text else " ",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            OPENROUTER_EMBED_URL,
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        resp.raise_for_status()
    data = resp.json()
    items = data.get("data") or []
    if not items:
        raise ValueError("OpenRouter returned no embedding data")
    emb = items[0].get("embedding")
    if not isinstance(emb, list):
        raise ValueError("Invalid embedding format")
    dimension = len(emb)
    return (emb, dimension)
