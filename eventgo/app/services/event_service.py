"""Event business logic."""

import os
import uuid

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.event import Event, EventStatus
from app.models.user import User
from app.schemas.event import EventCreate, EventUpdate

UPLOAD_DIR = "uploads"


async def get_event_or_404(db: AsyncSession, event_id: int) -> Event:
    """Fetch an event by id, or raise 404."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


async def list_events(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    keyword: str | None = None,
    category_slug: str | None = None,
    event_status: str | None = None,
) -> tuple[list[Event], int]:
    """List events with pagination, search, and filtering.

    SQL equivalent:
      SELECT e.* FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE (e.title LIKE :kw OR e.description LIKE :kw)
        AND (c.slug = :slug)
        AND (e.status = :status)
      ORDER BY e.created_at DESC
      LIMIT :limit OFFSET :offset;
    """
    query = select(Event).order_by(Event.created_at.desc())

    if keyword:
        query = query.where(
            or_(
                Event.title.contains(keyword),
                Event.description.contains(keyword),
            )
        )

    if category_slug:
        query = query.join(Category).where(Category.slug == category_slug)

    if event_status:
        query = query.where(Event.status == event_status)
    else:
        # Default: show published and completed events
        query = query.where(Event.status.in_([EventStatus.PUBLISHED, EventStatus.COMPLETED]))

    # Get total count
    count_query = select(Event)
    if keyword:
        count_query = count_query.where(
            or_(
                Event.title.contains(keyword),
                Event.description.contains(keyword),
            )
        )
    if category_slug:
        count_query = count_query.join(Category).where(Category.slug == category_slug)
    if event_status:
        count_query = count_query.where(Event.status == event_status)
    else:
        count_query = count_query.where(
            Event.status.in_([EventStatus.PUBLISHED, EventStatus.COMPLETED])
        )

    result = await db.execute(count_query)
    total = len(result.scalars().all())

    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    events = list(result.scalars().all())

    return events, total


async def create_event(db: AsyncSession, data: EventCreate, organizer_id: int) -> Event:
    """Create a new event.

    SQL equivalent:
      INSERT INTO events (title, description, ..., organizer_id)
      VALUES (:title, :description, ..., :organizer_id);
    """
    event = Event(
        title=data.title,
        description=data.description,
        location=data.location,
        start_time=data.start_time,
        end_time=data.end_time,
        max_capacity=data.max_capacity,
        category_id=data.category_id,
        organizer_id=organizer_id,
        status=EventStatus(data.status) if data.status else EventStatus.DRAFT,
    )
    db.add(event)
    await db.flush()
    return event


async def update_event(db: AsyncSession, event: Event, data: EventUpdate) -> Event:
    """Update an existing event (partial update).

    SQL equivalent:
      UPDATE events SET title = :title, ... WHERE id = :id;
    """
    update_data = data.model_dump(exclude_unset=True)
    if "status" in update_data:
        update_data["status"] = EventStatus(update_data["status"])
    for key, value in update_data.items():
        setattr(event, key, value)
    db.add(event)
    await db.flush()
    return event


async def delete_event(db: AsyncSession, event: Event) -> None:
    """Soft-delete an event (set status to cancelled)."""
    event.status = EventStatus.CANCELLED
    db.add(event)
    await db.flush()


async def upload_cover(db: AsyncSession, event: Event, file: UploadFile) -> str:
    """Upload a cover image for an event.

    The file is saved to the local `uploads/` directory with a UUID filename.
    In production, this would use cloud storage (S3/Blob).
    """
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    event.cover_image = f"/uploads/{filename}"
    db.add(event)
    await db.flush()
    return event.cover_image
