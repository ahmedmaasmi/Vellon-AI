"""
Note repository: data access for notes. All queries are scoped by user_id.
"""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.note import Note
from app.db.models.tag import note_tags


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
        """Create and persist a note. sort_order set to max+1. Caller must commit session."""
        subq = select(func.coalesce(func.max(Note.sort_order), -1)).where(Note.user_id == user_id, Note.is_deleted.is_(False))
        result = await self._session.execute(subq)
        next_order = (result.scalar_one() or 0) + 1
        note = Note(
            user_id=user_id,
            title=title,
            content=content,
            source=source,
            is_archived=is_archived,
            sort_order=next_order,
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

    async def get_note_by_id_with_tags(
        self,
        user_id: uuid.UUID,
        note_id: uuid.UUID,
        *,
        include_deleted: bool = False,
    ) -> Note | None:
        """Return note by id with tags loaded. Used for GET single note response."""
        result = await self._session.execute(
            select(Note)
            .options(selectinload(Note.tags))
            .where(
                Note.id == note_id,
                self._base_where(user_id, include_deleted),
            )
        )
        return result.scalar_one_or_none()

    def _list_where(
        self,
        user_id: uuid.UUID,
        *,
        include_deleted: bool = False,
        archived_only: bool | None = None,
        deleted_only: bool = False,
        favorite_only: bool | None = None,
        pinned_only: bool | None = None,
    ):
        """Build criterion for list/count. archived_only/pinned_only/favorite_only filter; deleted_only = trash view."""
        if deleted_only:
            criterion = self._base_where(user_id, include_deleted=True) & Note.is_deleted.is_(True)
        else:
            criterion = self._base_where(user_id, include_deleted=include_deleted)
        if archived_only is not None:
            criterion = criterion & (Note.is_archived.is_(archived_only))
        if favorite_only is not None:
            criterion = criterion & (Note.is_favorite.is_(favorite_only))
        if pinned_only is not None:
            criterion = criterion & (Note.is_pinned.is_(pinned_only))
        return criterion

    async def list_notes(
        self,
        user_id: uuid.UUID,
        *,
        limit: int = 100,
        offset: int = 0,
        include_deleted: bool = False,
        archived_only: bool | None = None,
        deleted_only: bool = False,
        favorite_only: bool | None = None,
        pinned_only: bool | None = None,
        search_q: str | None = None,
        tag_id: uuid.UUID | None = None,
    ) -> list[Note]:
        """List notes for the user, ordered by sort_order asc then updated_at desc.
        Excludes soft-deleted by default unless deleted_only=True.
        search_q: optional ILIKE filter on title and content.
        tag_id: if set, only notes that have this tag (user must own the tag; checked by join)."""
        criterion = self._list_where(
            user_id,
            include_deleted=include_deleted,
            archived_only=archived_only,
            deleted_only=deleted_only,
            favorite_only=favorite_only,
            pinned_only=pinned_only,
        )
        if search_q and search_q.strip():
            q = f"%{search_q.strip()}%"
            criterion = criterion & (
                or_(
                    Note.title.ilike(q),
                    Note.content.ilike(q),
                    Note.translated_text.ilike(q),
                )
            )
        stmt = (
            select(Note)
            .where(criterion)
            .options(selectinload(Note.tags))
            .order_by(Note.sort_order.asc(), Note.updated_at.desc())
            .limit(limit)
            .offset(offset)
        )
        if tag_id is not None:
            stmt = stmt.join(note_tags, Note.id == note_tags.c.note_id).where(
                note_tags.c.tag_id == tag_id
            )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_note_counts(self, user_id: uuid.UUID) -> dict[str, int]:
        """Return counts for sidebar: all, archived (is_archived), pinned (is_pinned), favorite, deleted."""
        base = Note.user_id == user_id
        non_deleted = base & Note.is_deleted.is_(False)
        all_stmt = select(func.count()).select_from(Note).where(non_deleted)
        archived_stmt = select(func.count()).select_from(Note).where(non_deleted & Note.is_archived.is_(True))
        pinned_stmt = select(func.count()).select_from(Note).where(non_deleted & Note.is_pinned.is_(True))
        favorite_stmt = select(func.count()).select_from(Note).where(non_deleted & Note.is_favorite.is_(True))
        deleted_stmt = select(func.count()).select_from(Note).where(base & Note.is_deleted.is_(True))
        all_result = await self._session.execute(all_stmt)
        archived_result = await self._session.execute(archived_stmt)
        pinned_result = await self._session.execute(pinned_stmt)
        favorite_result = await self._session.execute(favorite_stmt)
        deleted_result = await self._session.execute(deleted_stmt)
        return {
            "all": all_result.scalar_one() or 0,
            "archived": archived_result.scalar_one() or 0,
            "pinned": pinned_result.scalar_one() or 0,
            "favorite": favorite_result.scalar_one() or 0,
            "deleted": deleted_result.scalar_one() or 0,
        }

    _updatable_note_attrs = frozenset(
        {
            "title",
            "content",
            "source",
            "is_archived",
            "is_favorite",
            "is_pinned",
            "sort_order",
            "voice_audio_path",
            "voice_audio_mime",
            "voice_duration_seconds",
            "voice_status",
            "voice_error",
            "transcript_language",
            "translated_text",
            "sts_audio_path",
        }
    )

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

    async def restore_note(self, user_id: uuid.UUID, note_id: uuid.UUID) -> Note | None:
        """Clear soft-delete flag. Returns None if not found or not in trash."""
        note = await self.get_note_by_id(user_id, note_id, include_deleted=True)
        if note is None or not note.is_deleted:
            return None
        note.is_deleted = False
        await self._session.flush()
        await self._session.refresh(note)
        return note

    async def hard_delete_note(self, user_id: uuid.UUID, note_id: uuid.UUID) -> bool:
        """Permanently delete a soft-deleted note. Returns False if not in trash or missing."""
        note = await self.get_note_by_id(user_id, note_id, include_deleted=True)
        if note is None or not note.is_deleted:
            return False
        await self._session.delete(note)
        await self._session.flush()
        return True

    async def reorder_notes(
        self,
        user_id: uuid.UUID,
        note_ids_in_order: list[uuid.UUID],
    ) -> None:
        """Update sort_order for notes to match the given order. Only notes owned by user are updated."""
        for idx, note_id in enumerate(note_ids_in_order):
            note = await self.get_note_by_id(user_id, note_id, include_deleted=False)
            if note is not None:
                note.sort_order = idx
        await self._session.flush()
