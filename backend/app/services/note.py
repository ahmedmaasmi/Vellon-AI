"""
Note service: create note with user ownership and business validation.
"""

from __future__ import annotations

from app.db.models.user import User
from app.db.repositories import NoteRepository
from app.schemas.note import NoteCreateInput, NoteResponse


class InvalidNoteContentError(Exception):
    """Note content must be non-empty after stripping whitespace."""

    pass


class NoteService:
    """Create-note use case: enforces user_id from current_user, validates content."""

    def __init__(self, note_repo: NoteRepository) -> None:
        self._note_repo = note_repo

    async def create_note(
        self,
        current_user: User,
        body: NoteCreateInput,
    ) -> NoteResponse:
        """Create a note for the current user."""
        content = body.content.strip()
        if not content:
            raise InvalidNoteContentError()

        note = await self._note_repo.create_note(
            user_id=current_user.id,
            content=content,
            title=body.title,
            source=body.source or "web",
            is_archived=False,
        )
        return NoteResponse.model_validate(note)
