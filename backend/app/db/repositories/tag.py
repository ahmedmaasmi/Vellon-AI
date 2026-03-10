"""
Tag repository: data access for tags. All queries are scoped by user_id.
"""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.tag import Tag, note_tags


class TagRepository:
    """Data access for Tag entity. All methods require user_id for ownership."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_tags(self, user_id: uuid.UUID) -> list[Tag]:
        """List all tags for the user, ordered by name."""
        stmt = select(Tag).where(Tag.user_id == user_id).order_by(Tag.name.asc())
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_tag_by_id(self, user_id: uuid.UUID, tag_id: uuid.UUID) -> Tag | None:
        """Return tag by id if it belongs to the user."""
        result = await self._session.execute(
            select(Tag).where(Tag.id == tag_id, Tag.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_tag_by_name(self, user_id: uuid.UUID, name: str) -> Tag | None:
        """Return tag by name for the user, or None."""
        result = await self._session.execute(
            select(Tag).where(Tag.user_id == user_id, Tag.name == name.strip())
        )
        return result.scalar_one_or_none()

    async def create_tag(self, user_id: uuid.UUID, name: str) -> Tag:
        """Create a tag. Name is trimmed; unique per user. Caller must commit."""
        tag = Tag(user_id=user_id, name=name.strip())
        self._session.add(tag)
        await self._session.flush()
        await self._session.refresh(tag)
        return tag

    async def create_tag_if_not_exists(self, user_id: uuid.UUID, name: str) -> Tag:
        """Get existing tag by name or create. Returns the tag. Caller must commit."""
        existing = await self.get_tag_by_name(user_id, name)
        if existing is not None:
            return existing
        return await self.create_tag(user_id, name)

    async def attach_to_note(self, note_id: uuid.UUID, tag_id: uuid.UUID) -> None:
        """Associate tag with note. Idempotent. Caller must commit."""
        from sqlalchemy.dialects.postgresql import insert as pg_insert
        stmt = pg_insert(note_tags).values(note_id=note_id, tag_id=tag_id).on_conflict_do_nothing()
        await self._session.execute(stmt)

    async def detach_from_note(self, note_id: uuid.UUID, tag_id: uuid.UUID) -> None:
        """Remove tag from note. Caller must commit."""
        from sqlalchemy import delete
        await self._session.execute(
            delete(note_tags).where(
                note_tags.c.note_id == note_id,
                note_tags.c.tag_id == tag_id,
            )
        )