"""
User repository: data access for users.
"""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User


class UserRepository:
    """Data access for User entity."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        """Return user by primary key, or None."""
        result = await self._session.execute(select(User).where(User.id == user_id))
        return result.scalars().one_or_none()

    async def get_by_organization_and_email(
        self, organization_id: uuid.UUID, email: str
    ) -> User | None:
        """Return user scoped by organization and email, or None."""
        result = await self._session.execute(
            select(User).where(
                User.organization_id == organization_id,
                User.email == email,
            )
        )
        return result.scalars().one_or_none()

    async def create(
        self,
        *,
        organization_id: uuid.UUID,
        email: str,
        hashed_password: str,
        display_name: str | None = None,
        role: str = "member",
    ) -> User:
        """Create and persist a user. Caller must commit session."""
        user = User(
            organization_id=organization_id,
            email=email,
            hashed_password=hashed_password,
            display_name=display_name,
            role=role,
        )
        self._session.add(user)
        await self._session.flush()
        await self._session.refresh(user)
        return user
