"""
Tags routes: list and create tags for the current user.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.models.user import User
from app.db.repositories import TagRepository
from app.db.session import get_db_session
from app.schemas.tag import TagCreateInput, TagResponse, TagUpdateInput

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagResponse])
async def list_tags(
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> list[TagResponse]:
    """List all tags for the current user."""
    repo = TagRepository(session)
    tags = await repo.list_tags(user_id=user.id)
    return [TagResponse.model_validate(t) for t in tags]


@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    body: TagCreateInput,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> TagResponse:
    """Create a tag. Name is unique per user."""
    repo = TagRepository(session)
    existing = await repo.get_tag_by_name(user_id=user.id, name=body.name)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A tag with this name already exists",
        )
    tag = await repo.create_tag(user_id=user.id, name=body.name)
    return TagResponse.model_validate(tag)


@router.patch("/{tag_id}", response_model=TagResponse)
async def update_tag(
    tag_id: uuid.UUID,
    body: TagUpdateInput,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> TagResponse:
    """Rename a tag. Name must remain unique per user."""
    repo = TagRepository(session)
    conflict = await repo.get_tag_by_name(user_id=user.id, name=body.name)
    if conflict is not None and conflict.id != tag_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A tag with this name already exists",
        )
    tag = await repo.update_tag_name(user_id=user.id, tag_id=tag_id, name=body.name)
    if tag is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    return TagResponse.model_validate(tag)


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> Response:
    """Delete a tag and remove it from all notes."""
    repo = TagRepository(session)
    ok = await repo.delete_tag(user_id=user.id, tag_id=tag_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
