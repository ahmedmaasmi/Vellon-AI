"""
Tags routes: list and create tags for the current user.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.models.user import User
from app.db.repositories import TagRepository
from app.db.session import get_db_session
from app.schemas.tag import TagCreateInput, TagResponse

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
