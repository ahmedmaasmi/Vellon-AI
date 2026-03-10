"""
Tag ORM model. Tags belong to a user; notes can have many tags via note_tags.
"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Column, ForeignKey, String, Table, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.db.models.note import Note
    from app.db.models.user import User


note_tags = Table(
    "note_tags",
    Base.metadata,
    Column("note_id", PG_UUID(as_uuid=True), ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", PG_UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Tag entity. Owned by a user; unique name per user."""

    __tablename__ = "tags"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False)

    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_tags_user_name"),)

    user: Mapped["User"] = relationship(
        "User",
        back_populates="tags",
        lazy="raise",
    )
    notes: Mapped[list["Note"]] = relationship(
        "Note",
        secondary=note_tags,
        back_populates="tags",
        lazy="raise",
    )
