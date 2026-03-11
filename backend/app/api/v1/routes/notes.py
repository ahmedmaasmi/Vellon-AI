"""
Notes routes: authenticated CRUD and AI features (summarize, keywords) for current user's notes.
"""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_note_or_404, get_note_with_tags_or_404, get_redis
from app.db.models.note import Note
from app.db.models.user import User
from app.db.repositories import NoteRepository, TagRepository, UsageLogRepository
from app.db.session import get_db_session
from app.schemas.note import (
    EmbeddingsResponse,
    KeywordsResponse,
    NoteCountsResponse,
    NoteCreateInput,
    NoteResponse,
    NotesReorderInput,
    NoteUpdateInput,
    SummaryResponse,
)
from app.core.rate_limit import RateLimitExceeded, check_and_increment_ai_usage
from app.services.ai import (
    AINotConfiguredError,
    delete_cached_keywords,
    delete_cached_summary,
    extract_keywords,
    get_cached_keywords,
    get_cached_summary,
    get_openrouter_client,
    set_cached_keywords,
    set_cached_summary,
    summarize_text,
)
from app.services.embeddings import (
    OpenRouterNotConfiguredError,
    generate_embedding,
    get_cached_embedding,
    set_cached_embedding,
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
        user_id=user.id,
        title=body.title,
        content=body.content,
        source=body.source,
        is_archived=body.is_archived,
    )
    note_with_tags = await repo.get_note_by_id_with_tags(user_id=user.id, note_id=note.id)
    assert note_with_tags is not None
    return NoteResponse.model_validate(note_with_tags)


@router.get("/counts", response_model=NoteCountsResponse)
async def get_note_counts(
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> NoteCountsResponse:
    """Return counts for sidebar: all (non-deleted), archived, deleted."""
    repo = NoteRepository(session)
    counts = await repo.get_note_counts(user_id=user.id)
    return NoteCountsResponse(**counts)


@router.get("", response_model=list[NoteResponse])
async def list_notes(
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
    archived: Annotated[bool | None, Query(alias="archived")] = None,
    deleted: Annotated[bool, Query()] = False,
    favorite: Annotated[bool | None, Query()] = None,
    pinned: Annotated[bool | None, Query()] = None,
    q: Annotated[str | None, Query()] = None,
    tag_id: Annotated[uuid.UUID | None, Query()] = None,
) -> list[NoteResponse]:
    repo = NoteRepository(session)
    notes = await repo.list_notes(
        user_id=user.id,
        limit=limit,
        offset=offset,
        archived_only=archived,
        deleted_only=deleted,
        favorite_only=favorite,
        pinned_only=pinned,
        search_q=q,
        tag_id=tag_id,
    )
    return [NoteResponse.model_validate(note) for note in notes]


@router.post("/reorder", response_model=dict[str, str])
async def reorder_notes(
    body: NotesReorderInput,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> dict[str, str]:
    """Update sort_order of notes to match the given list. Must be defined before /{note_id}."""
    repo = NoteRepository(session)
    await repo.reorder_notes(user_id=user.id, note_ids_in_order=body.note_ids)
    return {"status": "ok"}


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(note: Note = Depends(get_note_with_tags_or_404)) -> NoteResponse:
    return NoteResponse.model_validate(note)


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: uuid.UUID,
    body: NoteUpdateInput,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
) -> NoteResponse:
    repo = NoteRepository(session)
    values = body.model_dump(exclude_unset=True)
    note = await repo.update_note(
        user_id=user.id,
        note_id=note_id,
        **values,
    )
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    if "title" in values or "content" in values:
        await delete_cached_summary(redis, note_id)
        await delete_cached_keywords(redis, note_id)
    note_with_tags = await repo.get_note_by_id_with_tags(user_id=user.id, note_id=note_id)
    assert note_with_tags is not None
    return NoteResponse.model_validate(note_with_tags)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> Response:
    repo = NoteRepository(session)
    note = await repo.soft_delete_note(
        user_id=user.id,
        note_id=note_id,
    )
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{note_id}/tags/{tag_id}", response_model=NoteResponse)
async def attach_tag_to_note(
    note_id: uuid.UUID,
    tag_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> NoteResponse:
    """Attach a tag to a note. Returns the note with tags loaded."""
    note_repo = NoteRepository(session)
    tag_repo = TagRepository(session)
    note = await note_repo.get_note_by_id(user_id=user.id, note_id=note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    tag = await tag_repo.get_tag_by_id(user_id=user.id, tag_id=tag_id)
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    await tag_repo.attach_to_note(note_id=note_id, tag_id=tag_id)
    note = await note_repo.get_note_by_id_with_tags(user_id=user.id, note_id=note_id)
    assert note is not None
    return NoteResponse.model_validate(note)


@router.delete("/{note_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def detach_tag_from_note(
    note_id: uuid.UUID,
    tag_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> Response:
    note_repo = NoteRepository(session)
    tag_repo = TagRepository(session)
    note = await note_repo.get_note_by_id(user_id=user.id, note_id=note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    tag = await tag_repo.get_tag_by_id(user_id=user.id, tag_id=tag_id)
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    await tag_repo.detach_from_note(note_id=note_id, tag_id=tag_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{note_id}/summary", response_model=SummaryResponse)
async def get_note_summary(
    note: Note = Depends(get_note_or_404),
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
) -> SummaryResponse:
    """Return AI summary for the note. Uses Redis cache when available. Rate-limited by plan when calling AI."""
    cached = await get_cached_summary(redis, note.id)
    if cached is not None:
        return SummaryResponse(summary=cached)

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
        summary = await summarize_text(client, note.content)
    except AINotConfiguredError:
        raise HTTPException(
            status_code=503,
            detail="AI summary not available (OpenRouter not configured)",
        )
    await set_cached_summary(redis, note.id, summary)
    usage_repo = UsageLogRepository(session)
    await usage_repo.log(
        user_id=user.id,
        action_type="ai_action",
        quantity=1,
    )
    return SummaryResponse(summary=summary)


@router.get("/{note_id}/keywords", response_model=KeywordsResponse)
async def get_note_keywords(
    note: Note = Depends(get_note_or_404),
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
) -> KeywordsResponse:
    """Return AI-extracted keywords for the note. Uses Redis cache when available. Rate-limited by plan when calling AI."""
    cached = await get_cached_keywords(redis, note.id)
    if cached is not None:
        return KeywordsResponse(keywords=cached)

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
        keywords = await extract_keywords(client, note.content)
    except AINotConfiguredError:
        raise HTTPException(
            status_code=503,
            detail="AI keywords not available (OpenRouter not configured)",
        )
    await set_cached_keywords(redis, note.id, keywords)
    usage_repo = UsageLogRepository(session)
    await usage_repo.log(
        user_id=user.id,
        action_type="ai_action",
        quantity=1,
    )
    return KeywordsResponse(keywords=keywords)


@router.post("/{note_id}/embeddings", response_model=EmbeddingsResponse)
async def create_note_embeddings(
    note: Note = Depends(get_note_or_404),
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
) -> EmbeddingsResponse:
    """Generate or return cached embeddings for the note. Quota-gated; backend-only OpenRouter key."""
    cached = await get_cached_embedding(redis, note.id)
    if cached is not None:
        embedding_vec, dimension = cached
        return EmbeddingsResponse(
            status="ok",
            dimension=dimension,
            note_id=note.id,
            cached=True,
        )

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

    try:
        embedding_vec, dimension = await generate_embedding(note.content)
    except OpenRouterNotConfiguredError:
        raise HTTPException(
            status_code=503,
            detail="Embeddings not available (OpenRouter not configured)",
        )
    await set_cached_embedding(redis, note.id, embedding_vec)
    usage_repo = UsageLogRepository(session)
    await usage_repo.log(
        user_id=user.id,
        action_type="ai_action",
        quantity=1,
    )
    return EmbeddingsResponse(
        status="ok",
        dimension=dimension,
        note_id=note.id,
        cached=False,
    )
