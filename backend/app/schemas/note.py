"""
Note API schemas: create input and response DTOs for the service layer.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class NoteCreateInput(BaseModel):
    """Input for creating a note. user_id is set from current_user in the route."""

    content: str = Field(...)
    title: str | None = Field(None, max_length=255)
    source: str = Field("web", max_length=64)
    is_archived: bool = False


class NoteUpdateInput(BaseModel):
    """Input for updating a note owned by the current user."""

    title: str | None = Field(None, max_length=255)
    content: str | None = Field(None)
    source: str | None = Field(None, max_length=64)
    is_archived: bool | None = None


class NoteResponse(BaseModel):
    """Response DTO for a note (from service layer)."""

    id: UUID
    user_id: UUID
    title: str | None
    content: str
    source: str
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SummaryResponse(BaseModel):
    """AI-generated summary for a note."""

    summary: str


class KeywordsResponse(BaseModel):
    """AI-extracted keywords for a note."""

    keywords: list[str]


class EmbeddingsResponse(BaseModel):
    """Metadata after generating or retrieving embeddings for a note (no raw vector)."""

    status: str = Field(..., description="ok")
    dimension: int = Field(..., description="Embedding vector dimension")
    note_id: UUID = Field(..., description="Note id")
    cached: bool = Field(False, description="True if result was served from cache")
