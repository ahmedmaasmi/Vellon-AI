"""
AI service: summarize and keyword extraction with optional Redis caching.
Uses OpenAI API when configured; cache keys follow PRD: summarize:{note_id}, keywords:{note_id}.
"""

from __future__ import annotations

import json
import uuid

from openai import AsyncOpenAI
from redis.asyncio import Redis

from app.core.config import settings
from app.integrations.redis.cache import get_cache, set_cache


class AINotConfiguredError(Exception):
    """OpenAI API key is not configured."""

    pass


def _cache_key_summary(note_id: uuid.UUID) -> str:
    return f"summarize:{note_id}"


def _cache_key_keywords(note_id: uuid.UUID) -> str:
    return f"keywords:{note_id}"


async def get_cached_summary(redis: Redis, note_id: uuid.UUID) -> str | None:
    """Return cached summary for note_id, or None."""
    return await get_cache(redis, _cache_key_summary(note_id))


async def set_cached_summary(
    redis: Redis,
    note_id: uuid.UUID,
    summary: str,
    ttl_seconds: int | None = None,
) -> None:
    """Store summary in cache."""
    ttl = ttl_seconds if ttl_seconds is not None else settings.ai_cache_ttl_seconds
    await set_cache(redis, _cache_key_summary(note_id), summary, ttl_seconds=ttl)


async def get_cached_keywords(redis: Redis, note_id: uuid.UUID) -> list[str] | None:
    """Return cached keywords for note_id, or None."""
    raw = await get_cache(redis, _cache_key_keywords(note_id))
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


async def set_cached_keywords(
    redis: Redis,
    note_id: uuid.UUID,
    keywords: list[str],
    ttl_seconds: int | None = None,
) -> None:
    """Store keywords in cache as JSON array."""
    ttl = ttl_seconds if ttl_seconds is not None else settings.ai_cache_ttl_seconds
    await set_cache(
        redis,
        _cache_key_keywords(note_id),
        json.dumps(keywords),
        ttl_seconds=ttl,
    )


async def summarize_text(client: AsyncOpenAI | None, content: str) -> str:
    """Produce a short summary of the given text. Raises AINotConfiguredError if client is None."""
    if client is None:
        raise AINotConfiguredError("OpenAI API key not configured")
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Summarize the following note in 1-3 concise sentences."},
            {"role": "user", "content": content[:8000]},
        ],
        max_tokens=256,
    )
    choice = response.choices[0] if response.choices else None
    if not choice or not choice.message or not choice.message.content:
        return ""
    return choice.message.content.strip()


async def extract_keywords(client: AsyncOpenAI | None, content: str) -> list[str]:
    """Extract a list of keywords from the given text. Raises AINotConfiguredError if client is None."""
    if client is None:
        raise AINotConfiguredError("OpenAI API key not configured")
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "Extract 5-15 important keywords or short phrases from the text. Return only a JSON array of strings, e.g. [\"keyword1\", \"keyword2\"].",
            },
            {"role": "user", "content": content[:8000]},
        ],
        max_tokens=256,
    )
    choice = response.choices[0] if response.choices else None
    if not choice or not choice.message or not choice.message.content:
        return []
    raw = choice.message.content.strip()
    # Allow markdown code block
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(l for l in lines if l and l != "```" and not l.startswith("```"))
    try:
        data = json.loads(raw)
        if isinstance(data, list) and all(isinstance(x, str) for x in data):
            return data[:20]
        return []
    except json.JSONDecodeError:
        return []


def get_openai_client() -> AsyncOpenAI | None:
    """Return an AsyncOpenAI client if API key is set, else None."""
    if not settings.openai_api_key:
        return None
    return AsyncOpenAI(api_key=settings.openai_api_key)
