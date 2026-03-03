"""
Versioned route modules.
Create route modules here and aggregate in a single v1 router.
"""

from fastapi import APIRouter

from app.api.v1.routes import auth, notes, webhooks

router = APIRouter()
router.include_router(auth.router)
router.include_router(notes.router)
router.include_router(webhooks.router)
