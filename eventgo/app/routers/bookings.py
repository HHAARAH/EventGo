"""Booking routes."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_organizer, get_current_user
from app.models.user import User
from app.schemas.booking import BookingMessage, BookingResponse, ParticipantResponse
from app.services import booking_service
from app.services.notification_service import create_notification

router = APIRouter(tags=["Bookings"])


@router.post(
    "/api/events/{event_id}/book",
    response_model=BookingMessage,
    status_code=status.HTTP_201_CREATED,
)
async def book_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Book an event (concurrency-safe).

    Uses SELECT ... FOR UPDATE to prevent overselling when multiple
    users try to book the last spot simultaneously.
    """
    booking = await booking_service.create_booking(db, current_user.id, event_id)

    # Create in-app notification (non-blocking)
    await create_notification(
        db,
        user_id=current_user.id,
        type_="booking_confirmed",
        title="Booking Confirmed",
        content=f"You have successfully booked the event.",
    )

    return BookingMessage(message="Booking confirmed", booking_id=booking.id)


@router.delete("/api/bookings/{booking_id}", response_model=BookingMessage)
async def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a booking and release one spot."""
    booking = await booking_service.get_booking_or_404(db, booking_id)
    if booking.user_id != current_user.id:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only cancel your own bookings",
        )
    await booking_service.cancel_booking(db, booking)

    await create_notification(
        db,
        user_id=current_user.id,
        type_="booking_cancelled",
        title="Booking Cancelled",
        content="Your booking has been cancelled.",
    )
    return BookingMessage(message="Booking cancelled", booking_id=booking.id)


@router.get("/api/bookings/my", response_model=list[BookingResponse])
async def my_bookings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's bookings."""
    bookings, _ = await booking_service.get_user_bookings(
        db, current_user.id, page=page, page_size=page_size
    )
    return bookings


@router.get(
    "/api/events/{event_id}/participants",
    response_model=list[ParticipantResponse],
)
async def list_participants(
    event_id: int,
    current_user: User = Depends(get_current_organizer),
    db: AsyncSession = Depends(get_db),
):
    """Get confirmed participants for an event (organizer/admin only).

    The organizer sees who has booked their event.
    """
    # Verify the user is the event organizer (or admin)
    from app.services.event_service import get_event_or_404
    event = await get_event_or_404(db, event_id)
    if event.organizer_id != current_user.id and current_user.role != "admin":
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the event organizer can view participants",
        )
    return await booking_service.get_event_participants(db, event_id)
