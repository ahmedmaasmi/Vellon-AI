"""
Organization repository: data access for organizations.
"""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.organization import Organization


class OrganizationRepository:
    """Data access for Organization entity."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_slug(self, slug: str) -> Organization | None:
        """Return organization by slug, or None."""
        result = await self._session.execute(
            select(Organization).where(Organization.slug == slug)
        )
        return result.scalar_one_or_none()

    async def create(self, *, name: str, slug: str) -> Organization:
        """Create and persist an organization. Caller must commit session."""
        org = Organization(name=name, slug=slug)
        self._session.add(org)
        await self._session.flush()
        await self._session.refresh(org)
        return org
