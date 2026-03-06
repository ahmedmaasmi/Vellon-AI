"""
Usage log model for tracking AI actions, speech, translation, Telegram (FR-2).
Scoped by user (no organizations).
"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class UsageLog(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """One row per usage event: AI action, speech minutes, translation, Telegram."""

    __tablename__ = "usage_logs"

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action_type: Mapped[str] = mapped_column(
        String(64), nullable=False, index=True
    )  # ai_action | speech_minutes | translation | telegram
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    metadata_: Mapped[str | None] = mapped_column(
        "metadata", Text, nullable=True
    )  # optional JSON for details
