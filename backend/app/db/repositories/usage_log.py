"""
Usage log repository: append-only usage events for billing/analytics.
Scoped by user (no organizations).
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.usage_log import UsageLog


class UsageLogRepository:
    """Append usage events and query aggregates per user."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def log(
        self,
        *,
        user_id: uuid.UUID | None,
        action_type: str,
        quantity: int = 1,
        metadata_: str | None = None,
    ) -> UsageLog:
        """Append a usage event. Caller must commit session."""
        entry = UsageLog(
            user_id=user_id,
            action_type=action_type,
            quantity=quantity,
            metadata_=metadata_,
        )
        self._session.add(entry)
        await self._session.flush()
        await self._session.refresh(entry)
        return entry

    async def sum_quantity_for_user_period(
        self,
        user_id: uuid.UUID,
        action_type: str,
        period_start: datetime,
        period_end: datetime,
    ) -> int:
        """Sum quantity for user and action type within [period_start, period_end)."""
        result = await self._session.execute(
            select(func.coalesce(func.sum(UsageLog.quantity), 0)).where(
                UsageLog.user_id == user_id,
                UsageLog.action_type == action_type,
                UsageLog.created_at >= period_start,
                UsageLog.created_at < period_end,
            )
        )
        val = result.scalar_one_or_none()
        return int(val or 0)
