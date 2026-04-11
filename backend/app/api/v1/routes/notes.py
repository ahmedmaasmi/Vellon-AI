"""
Notes routes: authenticated CRUD and AI features (summarize, keywords) for current user's notes.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Response, UploadFile, status
from fastapi.responses import FileResponse, StreamingResponse
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_note_or_404, get_note_with_tags_or_404, get_redis
from app.db.models.note import Note
from app.db.models.user import User
from app.db.repositories import NoteRepository, TagRepository, UsageLogRepository
from app.db.session import get_db_session
from app.core.config import settings
from app.schemas.note import (
    ChecklistItemInput,
    DescriptionResponse,
    EmbeddingsResponse,
    KeywordsResponse,
    NoteCountsResponse,
    NoteCreateInput,
    NoteResponse,
    NotesReorderInput,
    NoteStsInput,
    NoteTranslateInput,
    NoteTtsInput,
    NoteUpdateInput,
    SummaryResponse,
)
from app.core.rate_limit import RateLimitExceeded, check_and_increment_ai_usage, normalize_plan
from app.services.ai import (
    AINotConfiguredError,
    delete_cached_description,
    delete_cached_keywords,
    delete_cached_summary,
    describe_voice_memo,
    extract_keywords,
    get_cached_description,
    get_cached_keywords,
    get_cached_summary,
    get_openrouter_client,
    set_cached_description,
    set_cached_keywords,
    set_cached_summary,
    summarize_text,
    translate_text,
)
from app.services import elevenlabs_client
from app.services import media_storage
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
    checklist_data: list[dict] | None = None
    if body.checklist_items is not None:
        checklist_data = [c.model_dump() for c in body.checklist_items]
    note = await repo.create_note(
        user_id=user.id,
        title=body.title,
        content=body.content,
        source=body.source,
        is_archived=body.is_archived,
        color=body.color,
        note_type=body.note_type,
        checklist_items=checklist_data,
        reminder_at=body.reminder_at,
    )
    note_with_tags = await repo.get_note_by_id_with_tags(user_id=user.id, note_id=note.id)
    assert note_with_tags is not None
    return NoteResponse.model_validate(note_with_tags)


def _voice_file_extension(upload: UploadFile) -> str:
    name = upload.filename or ""
    if "." in name:
        return name.rsplit(".", 1)[-1].lower()[:12] or "webm"
    return "webm"


@router.post("/voice", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note_from_voice(
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
    audio: UploadFile = File(...),
    title: Annotated[str | None, Form()] = None,
) -> NoteResponse:
    """Upload recorded audio, persist file, transcribe with ElevenLabs, return the note."""
    if not settings.elevenlabs_api_key:
        raise HTTPException(
            status_code=503,
            detail="Voice transcription not configured (ElevenLabs API key missing)",
        )
    raw = await audio.read()
    if len(raw) > settings.voice_upload_max_bytes:
        raise HTTPException(status_code=413, detail="Audio file is too large")

    try:
        await check_and_increment_ai_usage(redis, user.id, plan=normalize_plan(user.plan))
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

    repo = NoteRepository(session)
    usage_repo = UsageLogRepository(session)
    ext = _voice_file_extension(audio)
    mime = audio.content_type or f"audio/{ext}"
    display_title = (title or "").strip() or None
    if not display_title:
        display_title = "Voice Memo"

    note = await repo.create_note(
        user_id=user.id,
        title=display_title,
        content="Transcribing your voice memo…",
        source="voice",
    )
    await session.flush()
    rel_path: str | None = None
    try:
        rel_path = media_storage.save_original_audio(user.id, note.id, raw, extension=ext)
        await repo.update_note(
            user_id=user.id,
            note_id=note.id,
            voice_audio_path=rel_path,
            voice_audio_mime=mime,
            voice_status="transcribing",
            voice_error=None,
        )
        transcript, lang, duration = await elevenlabs_client.transcribe_audio(
            raw,
            audio.filename or f"recording.{ext}",
            mime,
        )
        body = transcript.strip() if transcript else ""
        if not body:
            body = "(empty transcript)"
        await repo.update_note(
            user_id=user.id,
            note_id=note.id,
            content=body,
            voice_status="ready",
            transcript_language=lang,
            voice_duration_seconds=duration,
            voice_error=None,
        )
        await delete_cached_summary(redis, note.id)
        await delete_cached_keywords(redis, note.id)
        await delete_cached_description(redis, note.id)
        await usage_repo.log(user_id=user.id, action_type="ai_action", quantity=1)
    except elevenlabs_client.ElevenLabsNotConfiguredError:
        raise HTTPException(
            status_code=503,
            detail="Voice transcription not configured (ElevenLabs API key missing)",
        )
    except elevenlabs_client.ElevenLabsHttpError as e:
        err_msg = e.detail[:2000] if e.detail else str(e)
        await repo.update_note(
            user_id=user.id,
            note_id=note.id,
            content="Transcription failed. You can try **Re-transcribe** from the note.",
            voice_status="failed",
            voice_error=err_msg,
        )
        await delete_cached_summary(redis, note.id)
        await delete_cached_keywords(redis, note.id)
        await delete_cached_description(redis, note.id)
        await usage_repo.log(user_id=user.id, action_type="ai_action", quantity=1)
    except Exception:
        if rel_path:
            try:
                p = media_storage.abs_media_path(rel_path)
                p.unlink(missing_ok=True)
            except (OSError, ValueError):
                pass
        raise

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


@router.get("/reminders/due", response_model=list[NoteResponse])
async def list_due_reminders(
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
) -> list[NoteResponse]:
    """Notes with reminder_at set and reminder_at <= now (UTC). Client may dedupe for toasts."""
    repo = NoteRepository(session)
    now = datetime.now(timezone.utc)
    notes = await repo.list_notes(
        user_id=user.id,
        limit=limit,
        offset=0,
        reminder_due_before=now,
    )
    return [NoteResponse.model_validate(n) for n in notes]


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(note: Note = Depends(get_note_with_tags_or_404)) -> NoteResponse:
    return NoteResponse.model_validate(note)


@router.get("/{note_id}/audio/sts")
async def get_note_sts_audio(note: Note = Depends(get_note_or_404)) -> FileResponse:
    """Stream speech-to-speech output (mp3) if present."""
    if not note.sts_audio_path:
        raise HTTPException(status_code=404, detail="No speech-to-speech audio for this note")
    try:
        path = media_storage.abs_media_path(note.sts_audio_path)
    except ValueError:
        raise HTTPException(status_code=404, detail="Audio not found")
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Audio not found")
    return FileResponse(
        path,
        media_type="audio/mpeg",
        filename="voice-transform.mp3",
    )


@router.get("/{note_id}/audio")
async def get_note_original_audio(note: Note = Depends(get_note_or_404)) -> FileResponse:
    """Stream original voice memo recording."""
    if not note.voice_audio_path:
        raise HTTPException(status_code=404, detail="No voice recording for this note")
    try:
        path = media_storage.abs_media_path(note.voice_audio_path)
    except ValueError:
        raise HTTPException(status_code=404, detail="Audio not found")
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Audio not found")
    return FileResponse(
        path,
        media_type=note.voice_audio_mime or "application/octet-stream",
        filename=path.name,
    )


@router.get("/{note_id}/images/{image_id}")
async def get_note_image_file(
    note_id: uuid.UUID,
    image_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> Response:
    repo = NoteRepository(session)
    note = await repo.get_note_by_id(user_id=user.id, note_id=note_id, include_deleted=False)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    imgs = note.images or []
    rel_path: str | None = None
    for img in imgs:
        if not isinstance(img, dict):
            continue
        if str(img.get("id")) == str(image_id):
            rp = img.get("rel_path")
            if isinstance(rp, str):
                rel_path = rp
            break
    if rel_path is None:
        raise HTTPException(status_code=404, detail="Image not found")
    try:
        data, mime = media_storage.read_media_file(rel_path)
    except (FileNotFoundError, ValueError, OSError):
        raise HTTPException(status_code=404, detail="Image not found")
    return Response(content=data, media_type=mime)


@router.post("/{note_id}/images", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def upload_note_image(
    note_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
    file: UploadFile = File(...),
) -> NoteResponse:
    repo = NoteRepository(session)
    note = await repo.get_note_by_id(user_id=user.id, note_id=note_id, include_deleted=False)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    raw = await file.read()
    if len(raw) > settings.note_image_upload_max_bytes:
        raise HTTPException(status_code=413, detail="Image file is too large")
    name = file.filename or "image.jpg"
    ext = Path(name).suffix.lstrip(".").lower() or "jpg"
    new_img_id = uuid.uuid4()
    try:
        rel = media_storage.save_note_image(user.id, note_id, new_img_id, raw, extension=ext)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid image")
    imgs = [dict(x) for x in (note.images or []) if isinstance(x, dict)]
    imgs.append({"id": str(new_img_id), "rel_path": rel})
    updated = await repo.update_note(user_id=user.id, note_id=note_id, images=imgs)
    assert updated is not None
    note_with_tags = await repo.get_note_by_id_with_tags(user_id=user.id, note_id=note_id)
    assert note_with_tags is not None
    return NoteResponse.model_validate(note_with_tags)


@router.post("/{note_id}/copy", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def copy_note_endpoint(
    note_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> NoteResponse:
    repo = NoteRepository(session)
    copied = await repo.copy_note(user_id=user.id, note_id=note_id)
    if copied is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return NoteResponse.model_validate(copied)


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
    if "checklist_items" in values and values["checklist_items"] is not None:
        raw_items = values["checklist_items"]
        values["checklist_items"] = [
            ChecklistItemInput.model_validate(x).model_dump() for x in raw_items
        ]
    note = await repo.update_note(
        user_id=user.id,
        note_id=note_id,
        **values,
    )
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    if (
        "title" in values
        or "content" in values
        or "translated_text" in values
        or "checklist_items" in values
    ):
        await delete_cached_summary(redis, note_id)
        await delete_cached_keywords(redis, note_id)
        await delete_cached_description(redis, note_id)
    note_with_tags = await repo.get_note_by_id_with_tags(user_id=user.id, note_id=note_id)
    assert note_with_tags is not None
    return NoteResponse.model_validate(note_with_tags)


@router.post("/{note_id}/restore", response_model=NoteResponse)
async def restore_deleted_note(
    note_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> NoteResponse:
    """Restore a soft-deleted note from trash."""
    repo = NoteRepository(session)
    restored = await repo.restore_note(user_id=user.id, note_id=note_id)
    if restored is None:
        raise HTTPException(status_code=404, detail="Note not found or not in trash")
    note_with_tags = await repo.get_note_by_id_with_tags(user_id=user.id, note_id=note_id)
    assert note_with_tags is not None
    return NoteResponse.model_validate(note_with_tags)


@router.delete("/{note_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def permanently_delete_note(
    note_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> Response:
    """Permanently delete a note that is already in trash; removes stored media."""
    repo = NoteRepository(session)
    note = await repo.get_note_by_id(user_id=user.id, note_id=note_id, include_deleted=True)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    if not note.is_deleted:
        raise HTTPException(
            status_code=400,
            detail="Only notes in trash can be permanently deleted",
        )
    media_storage.delete_note_media_dir(user.id, note_id)
    ok = await repo.hard_delete_note(user_id=user.id, note_id=note_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Note not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
        await check_and_increment_ai_usage(redis, user.id, plan=normalize_plan(user.plan))
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


@router.get("/{note_id}/describe", response_model=DescriptionResponse)
async def get_note_voice_description(
    note: Note = Depends(get_note_or_404),
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
) -> DescriptionResponse:
    """Return AI description of voice memo content (transcript). Cached; rate-limited like other AI."""
    cached = await get_cached_description(redis, note.id)
    if cached is not None:
        return DescriptionResponse(description=cached)

    try:
        await check_and_increment_ai_usage(redis, user.id, plan=normalize_plan(user.plan))
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
        description = await describe_voice_memo(client, note.content)
    except AINotConfiguredError:
        raise HTTPException(
            status_code=503,
            detail="AI description not available (OpenRouter not configured)",
        )
    await set_cached_description(redis, note.id, description)
    usage_repo = UsageLogRepository(session)
    await usage_repo.log(
        user_id=user.id,
        action_type="ai_action",
        quantity=1,
    )
    return DescriptionResponse(description=description)


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
        await check_and_increment_ai_usage(redis, user.id, plan=normalize_plan(user.plan))
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
        await check_and_increment_ai_usage(redis, user.id, plan=normalize_plan(user.plan))
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


@router.post("/{note_id}/retranscribe", response_model=NoteResponse)
async def retranscribe_note(
    note_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
) -> NoteResponse:
    """Re-run ElevenLabs STT on the stored original audio."""
    if not settings.elevenlabs_api_key:
        raise HTTPException(
            status_code=503,
            detail="Voice transcription not configured (ElevenLabs API key missing)",
        )
    repo = NoteRepository(session)
    note = await repo.get_note_by_id(user_id=user.id, note_id=note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    if not note.voice_audio_path:
        raise HTTPException(status_code=400, detail="This note has no stored voice audio")

    try:
        await check_and_increment_ai_usage(redis, user.id, plan=normalize_plan(user.plan))
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
        raw, mime_hint = media_storage.read_media_file(note.voice_audio_path)
    except (FileNotFoundError, ValueError):
        raise HTTPException(status_code=404, detail="Audio file missing on server")

    usage_repo = UsageLogRepository(session)
    fname = note.voice_audio_path.rsplit("/", 1)[-1]
    try:
        transcript, lang, duration = await elevenlabs_client.transcribe_audio(
            raw,
            fname,
            note.voice_audio_mime or mime_hint,
        )
        body = transcript.strip() if transcript else ""
        if not body:
            body = "(empty transcript)"
        await repo.update_note(
            user_id=user.id,
            note_id=note_id,
            content=body,
            voice_status="ready",
            transcript_language=lang,
            voice_duration_seconds=duration,
            voice_error=None,
        )
        await delete_cached_summary(redis, note_id)
        await delete_cached_keywords(redis, note_id)
        await delete_cached_description(redis, note_id)
        await usage_repo.log(user_id=user.id, action_type="ai_action", quantity=1)
    except elevenlabs_client.ElevenLabsHttpError as e:
        err_msg = e.detail[:2000] if e.detail else str(e)
        await repo.update_note(
            user_id=user.id,
            note_id=note_id,
            voice_status="failed",
            voice_error=err_msg,
        )
        await usage_repo.log(user_id=user.id, action_type="ai_action", quantity=1)

    note_with_tags = await repo.get_note_by_id_with_tags(user_id=user.id, note_id=note_id)
    assert note_with_tags is not None
    return NoteResponse.model_validate(note_with_tags)


@router.post("/{note_id}/translate", response_model=NoteResponse)
async def translate_note(
    note_id: uuid.UUID,
    body: NoteTranslateInput,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
) -> NoteResponse:
    """Translate note body (transcript) via OpenRouter; store in translated_text."""
    repo = NoteRepository(session)
    note = await repo.get_note_by_id(user_id=user.id, note_id=note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    src = (note.content or "").strip()
    if not src:
        raise HTTPException(status_code=400, detail="Note has no text to translate")

    try:
        await check_and_increment_ai_usage(redis, user.id, plan=normalize_plan(user.plan))
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
        translated = await translate_text(client, src, body.target_language)
    except AINotConfiguredError:
        raise HTTPException(
            status_code=503,
            detail="Translation not available (OpenRouter not configured)",
        )
    if not translated.strip():
        raise HTTPException(status_code=502, detail="Translation produced empty result")

    await repo.update_note(
        user_id=user.id,
        note_id=note_id,
        translated_text=translated.strip(),
    )
    await delete_cached_summary(redis, note_id)
    await delete_cached_keywords(redis, note_id)
    await delete_cached_description(redis, note_id)
    usage_repo = UsageLogRepository(session)
    await usage_repo.log(user_id=user.id, action_type="ai_action", quantity=1)

    note_with_tags = await repo.get_note_by_id_with_tags(user_id=user.id, note_id=note_id)
    assert note_with_tags is not None
    return NoteResponse.model_validate(note_with_tags)


@router.post("/{note_id}/tts")
async def note_text_to_speech(
    note_id: uuid.UUID,
    body: NoteTtsInput,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
) -> StreamingResponse:
    """Synthesize speech from note content, translation, or custom text (ElevenLabs)."""
    if not settings.elevenlabs_api_key:
        raise HTTPException(
            status_code=503,
            detail="Text-to-speech not configured (ElevenLabs API key missing)",
        )
    repo = NoteRepository(session)
    note = await repo.get_note_by_id(user_id=user.id, note_id=note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")

    if body.source == "custom":
        text = (body.text or "").strip()
    elif body.source == "translated":
        text = (note.translated_text or "").strip()
    else:
        text = (note.content or "").strip()

    if not text:
        raise HTTPException(status_code=400, detail="No text available for text-to-speech")

    try:
        await check_and_increment_ai_usage(redis, user.id, plan=normalize_plan(user.plan))
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
        audio_bytes = await elevenlabs_client.synthesize_speech(text)
    except elevenlabs_client.ElevenLabsHttpError as e:
        raise HTTPException(status_code=502, detail=f"TTS failed: {e.detail[:500]}")
    usage_repo = UsageLogRepository(session)
    await usage_repo.log(user_id=user.id, action_type="ai_action", quantity=1)

    return StreamingResponse(
        iter([audio_bytes]),
        media_type="audio/mpeg",
        headers={"Content-Disposition": 'inline; filename="speech.mp3"'},
    )


@router.post("/{note_id}/speech-to-speech", response_model=NoteResponse)
async def note_speech_to_speech(
    note_id: uuid.UUID,
    body: NoteStsInput,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
) -> NoteResponse:
    """Transform stored voice audio with ElevenLabs speech-to-speech; save mp3 for playback."""
    if not settings.elevenlabs_api_key:
        raise HTTPException(
            status_code=503,
            detail="Speech-to-speech not configured (ElevenLabs API key missing)",
        )
    repo = NoteRepository(session)
    note = await repo.get_note_by_id(user_id=user.id, note_id=note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    if not note.voice_audio_path:
        raise HTTPException(status_code=400, detail="This note has no stored voice audio")

    try:
        await check_and_increment_ai_usage(redis, user.id, plan=normalize_plan(user.plan))
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
        raw, mime_hint = media_storage.read_media_file(note.voice_audio_path)
    except (FileNotFoundError, ValueError):
        raise HTTPException(status_code=404, detail="Audio file missing on server")

    voice_id = (body.voice_id or "").strip() or settings.elevenlabs_tts_voice_id
    fname = note.voice_audio_path.rsplit("/", 1)[-1]
    usage_repo = UsageLogRepository(session)
    try:
        out_bytes = await elevenlabs_client.speech_to_speech(
            raw,
            fname,
            note.voice_audio_mime or mime_hint,
            voice_id=voice_id,
        )
    except elevenlabs_client.ElevenLabsHttpError as e:
        raise HTTPException(status_code=502, detail=f"Speech-to-speech failed: {e.detail[:800]}")

    rel = media_storage.save_sts_audio(user.id, note.id, out_bytes)
    await repo.update_note(
        user_id=user.id,
        note_id=note_id,
        sts_audio_path=rel,
    )
    await usage_repo.log(user_id=user.id, action_type="ai_action", quantity=1)

    note_with_tags = await repo.get_note_by_id_with_tags(user_id=user.id, note_id=note_id)
    assert note_with_tags is not None
    return NoteResponse.model_validate(note_with_tags)
