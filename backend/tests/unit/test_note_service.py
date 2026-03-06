"""Unit tests for NoteService: create_note with user ownership and content validation."""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.schemas.note import NoteCreateInput, NoteResponse
from app.services.note import InvalidNoteContentError, NoteService


def _make_user(*, user_id: uuid.UUID | None = None):
    """Return a minimal current_user-like object with id."""
    uid = user_id or uuid.uuid4()
    user = MagicMock()
    user.id = uid
    return user


@pytest.mark.asyncio
async def test_create_note_success_returns_note_response_and_uses_current_user() -> None:
    """create_note uses current_user.id, returns NoteResponse."""
    user_id = uuid.uuid4()
    current_user = _make_user(user_id=user_id)

    now = datetime.now(timezone.utc)
    created_note = MagicMock()
    created_note.id = uuid.uuid4()
    created_note.user_id = user_id
    created_note.title = "My title"
    created_note.content = "Hello world"
    created_note.source = "web"
    created_note.is_archived = False
    created_note.created_at = now
    created_note.updated_at = now

    note_repo = AsyncMock()
    note_repo.create_note = AsyncMock(return_value=created_note)

    service = NoteService(note_repo=note_repo)
    body = NoteCreateInput(content="Hello world", title="My title")

    result = await service.create_note(current_user, body)

    assert isinstance(result, NoteResponse)
    assert result.id == created_note.id
    assert result.user_id == user_id
    assert result.content == "Hello world"
    assert result.title == "My title"
    note_repo.create_note.assert_awaited_once_with(
        user_id=user_id,
        content="Hello world",
        title="My title",
        source="web",
        is_archived=False,
    )


@pytest.mark.asyncio
async def test_create_note_empty_content_raises_invalid_note_content_error() -> None:
    """create_note with empty content raises InvalidNoteContentError."""
    current_user = _make_user()
    note_repo = AsyncMock()
    service = NoteService(note_repo=note_repo)

    with pytest.raises(InvalidNoteContentError):
        await service.create_note(current_user, NoteCreateInput(content=""))

    note_repo.create_note.assert_not_awaited()


@pytest.mark.asyncio
async def test_create_note_whitespace_only_content_raises_invalid_note_content_error() -> None:
    """create_note with whitespace-only content raises InvalidNoteContentError."""
    current_user = _make_user()
    note_repo = AsyncMock()
    service = NoteService(note_repo=note_repo)

    with pytest.raises(InvalidNoteContentError):
        await service.create_note(current_user, NoteCreateInput(content="   \n\t  "))

    note_repo.create_note.assert_not_awaited()
