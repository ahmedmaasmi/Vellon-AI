"""
Tag API schemas.
"""

from uuid import UUID

from pydantic import BaseModel, Field


class TagCreateInput(BaseModel):
    """Input for creating a tag."""

    name: str = Field(..., min_length=1, max_length=128)


class TagUpdateInput(BaseModel):
    """Input for renaming a tag."""

    name: str = Field(..., min_length=1, max_length=128)


class TagResponse(BaseModel):
    """Response DTO for a tag."""

    id: UUID
    name: str

    model_config = {"from_attributes": True}
