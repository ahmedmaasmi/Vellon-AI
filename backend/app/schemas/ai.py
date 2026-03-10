"""
AI generation request/response schemas for dashboard prompts.
"""

from pydantic import BaseModel, Field


class AIGenerateInput(BaseModel):
    """Input for POST /ai/generate: prompt type and optional seed/context."""

    prompt_type: str = Field(..., description="'brainstorm' or 'draft_summary'")
    seed: str = Field("", description="Optional context or prompt from the user")


class AIGenerateResponse(BaseModel):
    """Response: generated text content for the note."""

    content: str = Field(..., description="Generated text to use as note content")
