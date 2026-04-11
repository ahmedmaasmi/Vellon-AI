"""
Note API schemas: create input and response DTOs for the service layer.
"""

from datetime import datetime
from uuid import UUID

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class ChecklistItemInput(BaseModel):
    """Single checklist row."""

    text: str = Field(..., max_length=2000)
    checked: bool = False
    order: int = Field(0, ge=0, le=1_000_000)


class NoteImageMeta(BaseModel):
    """Image attachment metadata returned to clients (no raw server paths in new uploads)."""

    id: UUID
    rel_path: str = Field(..., description="Relative path under media root; fetch via GET .../images/{id}")

    model_config = {"from_attributes": False}


class NoteCreateInput(BaseModel):
    """Input for creating a note. user_id is set from current_user in the route."""

    content: str = Field(default="", max_length=500_000)
    title: str | None = Field(None, max_length=255)
    source: str = Field("web", max_length=64)
    is_archived: bool = False
    color: str | None = Field(None, max_length=32)
    note_type: Literal["text", "checklist"] = "text"
    checklist_items: list[ChecklistItemInput] | None = None
    reminder_at: datetime | None = None


class NoteUpdateInput(BaseModel):
    """Input for updating a note owned by the current user."""

    title: str | None = Field(None, max_length=255)
    content: str | None = Field(None)
    source: str | None = Field(None, max_length=64)
    is_archived: bool | None = None
    is_favorite: bool | None = None
    is_pinned: bool | None = None
    color: str | None = Field(None, max_length=32)
    note_type: Literal["text", "checklist"] | None = None
    checklist_items: list[ChecklistItemInput] | None = None
    reminder_at: datetime | None = None


class TagRefResponse(BaseModel):
    """Minimal tag info in note response."""

    id: UUID
    name: str

    model_config = {"from_attributes": True}


class NoteResponse(BaseModel):
    """Response DTO for a note (from service layer)."""

    id: UUID
    user_id: UUID
    title: str | None
    content: str
    source: str
    is_archived: bool
    is_favorite: bool
    is_pinned: bool
    sort_order: int
    color: str | None = None
    note_type: str = "text"
    checklist_items: list[dict[str, Any]] | None = None
    reminder_at: datetime | None = None
    images: list[dict[str, Any]] | None = None
    created_at: datetime
    updated_at: datetime
    tags: list[TagRefResponse] = []
    # Voice / ElevenLabs pipeline (no raw filesystem paths exposed)
    voice_audio_available: bool = False
    voice_status: str | None = None
    voice_error: str | None = None
    transcript_language: str | None = None
    translated_text: str | None = None
    voice_duration_seconds: float | None = None
    sts_audio_available: bool = False

    model_config = {"from_attributes": True}

    @field_validator("tags", mode="before")
    @classmethod
    def coerce_tags(cls, v: object) -> list[TagRefResponse]:
        if v is None:
            return []
        if isinstance(v, list):
            return [TagRefResponse.model_validate(t) for t in v]
        return []


class NoteCountsResponse(BaseModel):
    """Counts for sidebar: all, archived, pinned, favorite, deleted."""

    all: int
    archived: int
    pinned: int
    favorite: int
    deleted: int


class NotesReorderInput(BaseModel):
    """Payload for reorder: list of note ids in desired order."""

    note_ids: list[UUID] = Field(..., min_length=1)


class SummaryResponse(BaseModel):
    """AI-generated summary for a note."""

    summary: str


class KeywordsResponse(BaseModel):
    """AI-extracted keywords for a note."""

    keywords: list[str]


class DescriptionResponse(BaseModel):
    """AI-generated description of a voice memo from its transcript."""

    description: str


class EmbeddingsResponse(BaseModel):
    """Metadata after generating or retrieving embeddings for a note (no raw vector)."""

    status: str = Field(..., description="ok")
    dimension: int = Field(..., description="Embedding vector dimension")
    note_id: UUID = Field(..., description="Note id")
    cached: bool = Field(False, description="True if result was served from cache")


class NoteTranslateInput(BaseModel):
    """Translate note transcript/body via OpenRouter."""

    target_language: str = Field(..., min_length=2, max_length=64)


class NoteTtsInput(BaseModel):
    """Text-to-speech source selection."""

    source: Literal["content", "translated", "custom"] = "content"
    text: str | None = Field(None, max_length=50000)


class NoteStsInput(BaseModel):
    """Optional voice id for speech-to-speech; defaults to settings.elevenlabs_tts_voice_id."""

    voice_id: str | None = Field(None, max_length=128)
