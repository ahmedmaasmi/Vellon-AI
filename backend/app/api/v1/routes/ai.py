"""
AI generation route: freeform content for dashboard (brainstorm, draft summary).
Rate-limited and quota-gated like summary/keywords.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_redis
from app.core.rate_limit import RateLimitExceeded, check_and_increment_ai_usage
from app.db.models.user import User
from app.db.repositories import UsageLogRepository
from app.db.session import get_db_session
from app.schemas.ai import AIGenerateInput, AIGenerateResponse
from app.services.ai import AINotConfiguredError, generate_for_prompt, get_openrouter_client

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/generate", response_model=AIGenerateResponse)
async def generate_content(
    body: AIGenerateInput,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
) -> AIGenerateResponse:
    """Generate note content for dashboard: brainstorm ideas or draft summary. Rate-limited."""
    if body.prompt_type not in ("brainstorm", "draft_summary"):
        raise HTTPException(status_code=400, detail="prompt_type must be 'brainstorm' or 'draft_summary'")
    try:
        await check_and_increment_ai_usage(redis, user.id)
    except RateLimitExceeded as e:
        usage_repo = UsageLogRepository(session)
        await usage_repo.log(
            user_id=user.id,
            action_type="ai_action_blocked",
            quantity=1,
        )
        raise HTTPException(
            status_code=429,
            detail=f"AI usage limit exceeded: {e.current} > {e.limit} for this month",
        )
    client = get_openrouter_client()
    try:
        content = await generate_for_prompt(client, body.prompt_type, seed=body.seed)
    except AINotConfiguredError:
        raise HTTPException(
            status_code=503,
            detail="AI generation not available (OpenRouter not configured)",
        )
    usage_repo = UsageLogRepository(session)
    await usage_repo.log(
        user_id=user.id,
        action_type="ai_action",
        quantity=1,
    )
    return AIGenerateResponse(content=content)
