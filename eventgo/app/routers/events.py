"""Event routes."""

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_organizer, get_current_user
from app.models.user import User
from app.schemas.event import EventCreate, EventListResponse, EventResponse, EventUpdate
from app.services import event_service

router = APIRouter(prefix="/api/events", tags=["Events"])


@router.get("", response_model=EventListResponse)
async def list_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str | None = Query(None),
    category: str | None = Query(None),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List events with pagination, search, and filtering.

    Query parameters:
        page: Page number (default 1)
        page_size: Items per page (default 20, max 100)
        keyword: Search in title and description
        category: Filter by category slug
        status: Filter by event status (published/completed/draft/cancelled)
    """
    events, total = await event_service.list_events(
        db, page=page, page_size=page_size,
        keyword=keyword, category_slug=category, event_status=status,
    )
    return EventListResponse(items=events, total=total, page=page, page_size=page_size)


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    data: EventCreate,
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db),
):
    """Create a new event (organizer or admin only)."""
    event = await event_service.create_event(db, data, current_user.id)
    await db.refresh(event)  # Load relationships (organizer, category)
    return event


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(event_id: int, db: AsyncSession = Depends(get_db)):
    """Get event detail by ID."""
    return await event_service.get_event_or_404(db, event_id)


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    data: EventUpdate,
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db),
):
    """Update an event (owner or admin only)."""
    event = await event_service.get_event_or_404(db, event_id)
    if event.organizer_id != current_user.id and current_user.role != "admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the event owner")
    event = await event_service.update_event(db, event, data)
    await db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete an event (owner or admin only)."""
    event = await event_service.get_event_or_404(db, event_id)
    if event.organizer_id != current_user.id and current_user.role != "admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the event owner")
    await event_service.delete_event(db, event)


@router.post("/{event_id}/cover", response_model=EventResponse)
async def upload_cover(
    event_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db),
):
    """Upload a cover image for an event."""
    event = await event_service.get_event_or_404(db, event_id)
    if event.organizer_id != current_user.id and current_user.role != "admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the event owner")
    await event_service.upload_cover(db, event, file)
    await db.refresh(event)
    return event
