"""Notification business logic."""

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


async def create_notification(
    db: AsyncSession,
    user_id: int,
    type_: str,
    title: str,
    content: str | None = None,
) -> Notification:
    """Create an in-app notification record.

    SQL equivalent:
      INSERT INTO notifications (user_id, type, title, content)
      VALUES (:user_id, :type, :title, :content);
    """
    notification = Notification(
        user_id=user_id,
        type=type_,
        title=title,
        content=content,
    )
    db.add(notification)
    await db.flush()
    return notification


async def get_user_notifications(
    db: AsyncSession, user_id: int, page: int = 1, page_size: int = 20
) -> tuple[list[Notification], int]:
    """Get paginated notifications for a user.

    SQL equivalent:
      SELECT * FROM notifications
      WHERE user_id = :uid
      ORDER BY created_at DESC
      LIMIT :limit OFFSET :offset;
    """
    query = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
    )

    result = await db.execute(query)
    all_notifications = list(result.scalars().all())
    total = len(all_notifications)

    start = (page - 1) * page_size
    end = start + page_size
    return all_notifications[start:end], total


async def mark_as_read(db: AsyncSession, notification: Notification) -> None:
    """Mark a single notification as read."""
    notification.is_read = True
    db.add(notification)
    await db.flush()


async def mark_all_as_read(db: AsyncSession, user_id: int) -> None:
    """Mark all of a user's notifications as read.

    SQL equivalent:
      UPDATE notifications SET is_read = TRUE WHERE user_id = :uid AND is_read = FALSE;
    """
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)  # noqa: E712
        .values(is_read=True)
    )
    await db.flush()


async def get_notification_or_404(db: AsyncSession, notification_id: int) -> Notification:
    """Fetch a notification by id, or raise 404."""
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    notification = result.scalar_one_or_none()
    if notification is None:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found"
        )
    return notification
