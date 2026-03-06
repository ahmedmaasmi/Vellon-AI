"""
Usage and quota API schemas for plan-based limits and frontend display.
"""

from pydantic import BaseModel, Field


class QuotaResponse(BaseModel):
    """Quota metadata for the current user (AI actions per month)."""

    plan: str = Field(..., description="Current plan: free | pro | team")
    limit: int = Field(..., description="AI actions allowed per month")
    used: int = Field(..., description="AI actions used this month")
    remaining: int = Field(..., description="Remaining actions this month")
    reset_period_end: str = Field(
        ...,
        description="ISO timestamp when the current period resets (end of month)",
    )
