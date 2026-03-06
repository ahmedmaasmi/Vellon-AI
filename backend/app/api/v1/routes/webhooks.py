"""
Webhook routes: Stripe (billing) and Telegram, with signature/secret validation.
Single-user app: Stripe subscription updates are not applied to an organization.
"""

from __future__ import annotations

import hmac

from fastapi import APIRouter, Header, HTTPException, Request, Response

from app.core.config import settings

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
) -> Response:
    """
    Stripe webhook: verify signature and acknowledge.
    Single-user app has no organization to update; subscription events are acknowledged only.
    """
    payload = await request.body()
    _verify_stripe_signature(payload, stripe_signature)
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
    if not body:
        return Response(status_code=200)
    return Response(status_code=200)
