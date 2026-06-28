"""Notification routes."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.notification import NotificationResponse
from app.services import notification_service

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationResponse])
async def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's notifications (most recent first)."""
    notifications, _ = await notification_service.get_user_notifications(
        db, current_user.id, page=page, page_size=page_size
    )
    return notifications


@router.put("/{notification_id}/read")
async def mark_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a notification as read."""
    notification = await notification_service.get_notification_or_404(db, notification_id)
    if notification.user_id != current_user.id:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your notification")
    await notification_service.mark_as_read(db, notification)
    return {"message": "Notification marked as read"}


@router.put("/read-all")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all notifications as read."""
    await notification_service.mark_all_as_read(db, current_user.id)
    return {"message": "All notifications marked as read"}
