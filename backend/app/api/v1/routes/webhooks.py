"""
Webhook routes: Stripe (billing) and Telegram, with signature/secret validation.
"""

from __future__ import annotations

import hmac

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.repositories import OrganizationRepository
from app.db.session import get_db_session

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def _verify_stripe_signature(payload: bytes, signature: str | None):
    """
    Verify Stripe webhook signature and return the constructed event dict.
    Raises HTTPException 400 if invalid.
    """
    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=503, detail="Stripe webhook not configured")
    if not signature:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature")
    import stripe

    try:
        return stripe.Webhook.construct_event(
            payload,
            signature,
            settings.stripe_webhook_secret,
        )
    except stripe.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail=f"Invalid signature: {e}") from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload") from e


def _verify_telegram_secret(secret_token: str | None) -> None:
    """Verify Telegram webhook secret token (X-Telegram-Bot-Api-Secret-Token)."""
    if not settings.telegram_webhook_secret_token:
        return
    if not secret_token or not hmac.compare_digest(
        secret_token, settings.telegram_webhook_secret_token
    ):
        raise HTTPException(status_code=403, detail="Invalid Telegram secret token")


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(None, alias="Stripe-Signature"),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    """
    Stripe webhook: verify signature, handle subscription updates.
    Updates organization plan from subscription metadata.plan.
    """
    payload = await request.body()
    event = _verify_stripe_signature(payload, stripe_signature)

    event_type = getattr(event, "type", None) or (event.get("type") if isinstance(event, dict) else None)
    if not event_type:
        return Response(status_code=200)

    if event_type in (
        "customer.subscription.updated",
        "customer.subscription.created",
    ):
        data = getattr(event, "data", None) or (event.get("data") if isinstance(event, dict) else None)
        obj = getattr(data, "object", None) if data else (data.get("object") if isinstance(data, dict) else None)
        if not obj:
            return Response(status_code=200)
        customer_id = getattr(obj, "customer", None) or (obj.get("customer") if isinstance(obj, dict) else None)
        if isinstance(customer_id, dict):
            customer_id = customer_id.get("id")
        if not customer_id:
            return Response(status_code=200)
        metadata = getattr(obj, "metadata", None) or (obj.get("metadata") if isinstance(obj, dict) else None) or {}
        plan = metadata.get("plan", "free") if isinstance(metadata, dict) else "free"
        if plan not in ("free", "pro", "team"):
            plan = "free"
        org_repo = OrganizationRepository(session)
        org = await org_repo.get_by_stripe_customer_id(customer_id)
        if org is not None:
            org.plan = plan
            await session.flush()

    return Response(status_code=200)


@router.post("/telegram")
async def telegram_webhook(
    request: Request,
    x_telegram_bot_api_secret_token: str | None = Header(
        None, alias="X-Telegram-Bot-Api-Secret-Token"
    ),
) -> Response:
    """
    Telegram bot webhook: verify secret token, accept update.
    Returns 200 so Telegram stops retrying; actual handling can be done in a worker.
    """
    _verify_telegram_secret(x_telegram_bot_api_secret_token)
    body = await request.json()
    # Minimal handling: just acknowledge. Queue for background processing if needed.
    if not body:
        return Response(status_code=200)
    return Response(status_code=200)
