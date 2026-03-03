"""
Note repository: data access for notes. All queries are scoped by organization_id.
"""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.note import Note


class NoteRepository:
    """Data access for Note entity. All methods require organization_id for tenant isolation."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_note(
        self,
        *,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
        content: str,
        title: str | None = None,
        source: str = "web",
        is_archived: bool = False,
    ) -> Note:
        """Create and persist a note. Caller must commit session."""
        note = Note(
            organization_id=organization_id,
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
        organization_id: uuid.UUID,
        user_id: uuid.UUID | None = None,
        include_deleted: bool = False,
    ):
        criterion = Note.organization_id == organization_id
        if user_id is not None:
            criterion = criterion & (Note.user_id == user_id)
        if not include_deleted:
            criterion = criterion & Note.is_deleted.is_(False)
        return criterion

    async def get_note_by_id(
        self,
        organization_id: uuid.UUID,
        note_id: uuid.UUID,
        *,
        user_id: uuid.UUID | None = None,
        include_deleted: bool = False,
    ) -> Note | None:
        """Return note by id if it belongs to the organization; excludes soft-deleted by default."""
        result = await self._session.execute(
            select(Note).where(
                Note.id == note_id,
                self._base_where(organization_id, user_id, include_deleted),
            )
        )
        return result.scalar_one_or_none()

    async def list_notes(
        self,
        organization_id: uuid.UUID,
        *,
        user_id: uuid.UUID | None = None,
        limit: int = 100,
        offset: int = 0,
        include_deleted: bool = False,
    ) -> list[Note]:
        """List notes for the organization, ordered by created_at desc. Excludes soft-deleted by default."""
        stmt = (
            select(Note)
            .where(self._base_where(organization_id, user_id, include_deleted))
            .order_by(Note.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    _updatable_note_attrs = frozenset({"title", "content", "source", "is_archived"})

    async def update_note(
        self,
        organization_id: uuid.UUID,
        note_id: uuid.UUID,
        *,
        user_id: uuid.UUID | None = None,
        include_deleted: bool = False,
        **kwargs: Any,
    ) -> Note | None:
        """Update note if it belongs to the organization. Returns None if not found or inaccessible.
        Only title, content, source, and is_archived can be updated (no tenant/user change)."""
        note = await self.get_note_by_id(
            organization_id,
            note_id,
            user_id=user_id,
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
        organization_id: uuid.UUID,
        note_id: uuid.UUID,
        *,
        user_id: uuid.UUID | None = None,
    ) -> Note | None:
        """Mark note as deleted. Returns the note if found in org, else None. Idempotent for already-deleted."""
        note = await self.get_note_by_id(
            organization_id,
            note_id,
            user_id=user_id,
            include_deleted=True,
        )
        if note is None:
            return None
        note.is_deleted = True
        await self._session.flush()
        await self._session.refresh(note)
        return note
