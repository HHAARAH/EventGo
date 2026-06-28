"""Async email tasks using Celery."""

import asyncio

from app.tasks import celery_app


@celery_app.task(name="send_booking_email")
def send_booking_email(user_email: str, event_title: str, action: str):
    """Send a booking confirmation/cancellation email asynchronously.

    This runs in a Celery worker, not the main FastAPI process,
    so it never blocks the API response.

    In production, replace the aiosmtplib call with an actual email
    service (SendGrid, Mailgun, AWS SES). For now, it logs to console.
    """
    async def _send():
        # Placeholder — in production, use aiosmtplib or an email API.
        # Example:
        #   import aiosmtplib
        #   await aiosmtplib.send(
        #       message,
        #       hostname=settings.SMTP_HOST,
        #       port=settings.SMTP_PORT,
        #       username=settings.SMTP_USER,
        #       password=settings.SMTP_PASSWORD,
        #   )
        print(f"[EMAIL] To: {user_email} | {action}: {event_title}")

    asyncio.run(_send())
    return f"Email sent to {user_email}"
