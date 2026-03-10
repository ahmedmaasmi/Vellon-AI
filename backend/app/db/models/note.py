"""
Note ORM model. Notes belong to a user (single-user, no organizations).
"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.db.models.user import User
    from app.db.models.tag import Tag


class Note(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Note entity. Owned by a user."""

    __tablename__ = "notes"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        server_default=text("'web'"),
        default="web",
    )
    is_archived: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
        default=False,
    )
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
        default=False,
    )
    is_favorite: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
        default=False,
    )
    is_pinned: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
        default=False,
    )
    sort_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text("0"),
        default=0,
    )

    __table_args__ = (
        Index("ix_notes_created_at", "created_at"),
        Index("ix_notes_sort_order", "sort_order"),
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="notes",
        lazy="raise",
    )
    tags: Mapped[list["Tag"]] = relationship(
        "Tag",
        secondary="note_tags",  # table name; table defined in tag.py
        back_populates="notes",
        lazy="raise",
    )
