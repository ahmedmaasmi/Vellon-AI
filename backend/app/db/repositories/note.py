"""
Note repository: data access for notes. All queries are scoped by user_id.
"""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.note import Note


class NoteRepository:
    """Data access for Note entity. All methods require user_id for ownership."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_note(
        self,
        *,
        user_id: uuid.UUID,
        content: str,
        title: str | None = None,
        source: str = "web",
        is_archived: bool = False,
    ) -> Note:
        """Create and persist a note. Caller must commit session."""
        note = Note(
            user_id=user_id,
            title=title,
            content=content,
            source=source,
            is_archived=is_archived,
        )
        self._session.add(note)
        await self._session.flush()
        await self._session.refresh(note)
        return note

    def _base_where(
        self,
        user_id: uuid.UUID,
        include_deleted: bool = False,
    ):
        criterion = Note.user_id == user_id
        if not include_deleted:
            criterion = criterion & Note.is_deleted.is_(False)
        return criterion

    async def get_note_by_id(
        self,
        user_id: uuid.UUID,
        note_id: uuid.UUID,
        *,
        include_deleted: bool = False,
    ) -> Note | None:
        """Return note by id if it belongs to the user; excludes soft-deleted by default."""
        result = await self._session.execute(
            select(Note).where(
                Note.id == note_id,
                self._base_where(user_id, include_deleted),
            )
        )
        return result.scalar_one_or_none()

    async def list_notes(
        self,
        user_id: uuid.UUID,
        *,
        limit: int = 100,
        offset: int = 0,
        include_deleted: bool = False,
    ) -> list[Note]:
        """List notes for the user, ordered by created_at desc. Excludes soft-deleted by default."""
        stmt = (
            select(Note)
            .where(self._base_where(user_id, include_deleted))
            .order_by(Note.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    _updatable_note_attrs = frozenset({"title", "content", "source", "is_archived"})

    async def update_note(
        self,
        user_id: uuid.UUID,
        note_id: uuid.UUID,
        *,
        include_deleted: bool = False,
        **kwargs: Any,
    ) -> Note | None:
        """Update note if it belongs to the user. Returns None if not found.
        Only title, content, source, and is_archived can be updated."""
        note = await self.get_note_by_id(
            user_id,
            note_id,
            include_deleted=include_deleted,
        )
        if note is None:
            return None
        for key, value in kwargs.items():
            if key in self._updatable_note_attrs:
                setattr(note, key, value)
        await self._session.flush()
        await self._session.refresh(note)
        return note

    async def soft_delete_note(
        self,
        user_id: uuid.UUID,
        note_id: uuid.UUID,
    ) -> Note | None:
        """Mark note as deleted. Returns the note if found, else None. Idempotent for already-deleted."""
        note = await self.get_note_by_id(
            user_id,
            note_id,
            include_deleted=True,
        )
        if note is None:
            return None
        note.is_deleted = True
        await self._session.flush()
        await self._session.refresh(note)
        return note
