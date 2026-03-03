"""
API router aggregation.
Mount versioned routers here (e.g. v1).
"""

from fastapi import APIRouter

from app.api.v1.routes import router as v1_router

api_router = APIRouter()
api_router.include_router(v1_router, prefix="/v1", tags=["v1"])
