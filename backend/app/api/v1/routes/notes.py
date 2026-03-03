"""
Notes routes: authenticated CRUD and AI features (summarize, keywords) for current user's notes.
"""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_redis
from app.db.models.user import User
from app.db.repositories import NoteRepository, OrganizationRepository, UsageLogRepository
from app.db.session import get_db_session
from app.schemas.note import (
    KeywordsResponse,
    NoteCreateInput,
    NoteResponse,
    NoteUpdateInput,
    SummaryResponse,
)
from app.core.rate_limit import RateLimitExceeded, check_and_increment_ai_usage
from app.services.ai import (
    AINotConfiguredError,
    extract_keywords,
    get_cached_keywords,
    get_cached_summary,
    get_openai_client,
    set_cached_keywords,
    set_cached_summary,
    summarize_text,
)

router = APIRouter(prefix="/notes", tags=["notes"])


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    body: NoteCreateInput,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> NoteResponse:
    repo = NoteRepository(session)
    note = await repo.create_note(
        organization_id=user.organization_id,
        user_id=user.id,
        title=body.title,
        content=body.content,
        source=body.source,
        is_archived=body.is_archived,
    )
    return NoteResponse.model_validate(note)


@router.get("", response_model=list[NoteResponse])
async def list_notes(
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[NoteResponse]:
    repo = NoteRepository(session)
    notes = await repo.list_notes(
        organization_id=user.organization_id,
        user_id=user.id,
        limit=limit,
        offset=offset,
    )
    return [NoteResponse.model_validate(note) for note in notes]


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> NoteResponse:
    repo = NoteRepository(session)
    note = await repo.get_note_by_id(
        organization_id=user.organization_id,
        note_id=note_id,
        user_id=user.id,
    )
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return NoteResponse.model_validate(note)


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: uuid.UUID,
    body: NoteUpdateInput,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> NoteResponse:
    repo = NoteRepository(session)
    values = body.model_dump(exclude_unset=True)
    note = await repo.update_note(
        organization_id=user.organization_id,
        note_id=note_id,
        user_id=user.id,
        **values,
    )
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return NoteResponse.model_validate(note)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> Response:
    repo = NoteRepository(session)
    note = await repo.soft_delete_note(
        organization_id=user.organization_id,
        note_id=note_id,
        user_id=user.id,
    )
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{note_id}/summary", response_model=SummaryResponse)
async def get_note_summary(
    note_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
) -> SummaryResponse:
    """Return AI summary for the note. Uses Redis cache when available. Rate-limited by plan when calling AI."""
    repo = NoteRepository(session)
    note = await repo.get_note_by_id(
        organization_id=user.organization_id,
        note_id=note_id,
        user_id=user.id,
    )
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")

    cached = await get_cached_summary(redis, note_id)
    if cached is not None:
        return SummaryResponse(summary=cached)

    org_repo = OrganizationRepository(session)
    org = await org_repo.get_by_id(user.organization_id)
    if org is None:
        raise HTTPException(status_code=403, detail="Organization not found")
    try:
        await check_and_increment_ai_usage(redis, org.id, org.plan)
    except RateLimitExceeded as e:
        raise HTTPException(
            status_code=429,
            detail=f"AI usage limit exceeded: {e.current} > {e.limit} for this month",
        )

    client = get_openai_client()
    try:
        summary = await summarize_text(client, note.content)
    except AINotConfiguredError:
        raise HTTPException(
            status_code=503,
            detail="AI summary not available (OpenAI not configured)",
        )
    await set_cached_summary(redis, note_id, summary)
    usage_repo = UsageLogRepository(session)
    await usage_repo.log(
        organization_id=user.organization_id,
        user_id=user.id,
        action_type="ai_action",
        quantity=1,
    )
    return SummaryResponse(summary=summary)


@router.get("/{note_id}/keywords", response_model=KeywordsResponse)
async def get_note_keywords(
    note_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
) -> KeywordsResponse:
    """Return AI-extracted keywords for the note. Uses Redis cache when available. Rate-limited by plan when calling AI."""
    repo = NoteRepository(session)
    note = await repo.get_note_by_id(
        organization_id=user.organization_id,
        note_id=note_id,
        user_id=user.id,
    )
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")

    cached = await get_cached_keywords(redis, note_id)
    if cached is not None:
        return KeywordsResponse(keywords=cached)

    org_repo = OrganizationRepository(session)
    org = await org_repo.get_by_id(user.organization_id)
    if org is None:
        raise HTTPException(status_code=403, detail="Organization not found")
    try:
        await check_and_increment_ai_usage(redis, org.id, org.plan)
    except RateLimitExceeded as e:
        raise HTTPException(
            status_code=429,
            detail=f"AI usage limit exceeded: {e.current} > {e.limit} for this month",
        )

    client = get_openai_client()
    try:
        keywords = await extract_keywords(client, note.content)
    except AINotConfiguredError:
        raise HTTPException(
            status_code=503,
            detail="AI keywords not available (OpenAI not configured)",
        )
    await set_cached_keywords(redis, note_id, keywords)
    usage_repo = UsageLogRepository(session)
    await usage_repo.log(
        organization_id=user.organization_id,
        user_id=user.id,
        action_type="ai_action",
        quantity=1,
    )
    return KeywordsResponse(keywords=keywords)
