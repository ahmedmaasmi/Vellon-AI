"""
Note ORM model. Notes belong to a user (single-user, no organizations).
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
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

    # Google Keep–style fields
    color: Mapped[str | None] = mapped_column(String(32), nullable=True)
    note_type: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        server_default=text("'text'"),
        default="text",
    )
    checklist_items: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    reminder_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    images: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # Voice memo: server-stored original audio + ElevenLabs pipeline metadata
    voice_audio_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    voice_audio_mime: Mapped[str | None] = mapped_column(String(128), nullable=True)
    voice_duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    voice_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    voice_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    transcript_language: Mapped[str | None] = mapped_column(String(32), nullable=True)
    translated_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    sts_audio_path: Mapped[str | None] = mapped_column(String(512), nullable=True)

    @property
    def voice_audio_available(self) -> bool:
        return bool(self.voice_audio_path)

    @property
    def sts_audio_available(self) -> bool:
        return bool(self.sts_audio_path)

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
