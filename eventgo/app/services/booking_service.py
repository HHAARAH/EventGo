"""Booking business logic with concurrency-safe booking."""

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking import Booking, BookingStatus
from app.models.event import Event, EventStatus


class BookingError(Exception):
    """Custom exception for booking business rule violations."""


async def create_booking(db: AsyncSession, user_id: int, event_id: int) -> Booking:
    """Book an event with concurrency safety.

    This is the most important function in the project — it uses
    SELECT ... FOR UPDATE to lock the event row, preventing race
    conditions when multiple users try to book the last spot.

    SQL equivalent (simplified):
      BEGIN;
      SELECT * FROM events WHERE id = :eid FOR UPDATE;
      -- check capacity, status, duplicate
      UPDATE events SET current_participants = current_participants + 1 WHERE id = :eid;
      INSERT INTO bookings (user_id, event_id, status) VALUES (:uid, :eid, 'confirmed');
      COMMIT;
    """
    # Step 1: Lock the event row (FOR UPDATE prevents concurrent modification)
    result = await db.execute(
        select(Event).where(Event.id == event_id).with_for_update()
    )
    event = result.scalar_one_or_none()

    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Step 2: Validate business rules
    if event.status != EventStatus.PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot book an event with status '{event.status}'",
        )

    if event.current_participants >= event.max_capacity:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Event is fully booked",
        )

    # Step 3: Check for duplicate booking
    result = await db.execute(
        select(Booking).where(
            Booking.user_id == user_id,
            Booking.event_id == event_id,
            Booking.status == BookingStatus.CONFIRMED,
        )
    )
    existing = result.scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already booked this event",
        )

    # Step 4: Create booking and update participant count
    booking = Booking(
        user_id=user_id,
        event_id=event_id,
        status=BookingStatus.CONFIRMED,
    )
    db.add(booking)

    event.current_participants += 1
    db.add(event)

    await db.flush()
    return booking


async def cancel_booking(db: AsyncSession, booking: Booking) -> Booking:
    """Cancel a confirmed booking and release one spot.

    SQL equivalent:
      UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE id = :bid;
      UPDATE events SET current_participants = current_participants - 1 WHERE id = :eid;
    """
    if booking.status != BookingStatus.CONFIRMED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking is already cancelled",
        )

    booking.status = BookingStatus.CANCELLED
    booking.cancelled_at = datetime.now(timezone.utc)

    # Release one spot
    result = await db.execute(
        select(Event).where(Event.id == booking.event_id)
    )
    event = result.scalar_one()
    event.current_participants = max(0, event.current_participants - 1)
    db.add(event)

    db.add(booking)
    await db.flush()
    return booking


async def get_user_bookings(
    db: AsyncSession, user_id: int, page: int = 1, page_size: int = 20
) -> tuple[list[Booking], int]:
    """Get paginated bookings for a user.

    SQL equivalent:
      SELECT * FROM bookings
      WHERE user_id = :uid
      ORDER BY booked_at DESC
      LIMIT :limit OFFSET :offset;
    """
    query = (
        select(Booking)
        .where(Booking.user_id == user_id)
        .order_by(Booking.booked_at.desc())
    )

    result = await db.execute(query)
    all_bookings = list(result.scalars().all())
    total = len(all_bookings)

    # Apply pagination in Python (simple for an internship project)
    start = (page - 1) * page_size
    end = start + page_size
    return all_bookings[start:end], total


async def get_event_participants(db: AsyncSession, event_id: int) -> list[Booking]:
    """Get all confirmed participants for an event.

    SQL equivalent:
      SELECT * FROM bookings
      WHERE event_id = :eid AND status = 'confirmed'
      ORDER BY booked_at ASC;
    """
    result = await db.execute(
        select(Booking)
        .where(Booking.event_id == event_id, Booking.status == BookingStatus.CONFIRMED)
        .order_by(Booking.booked_at)
    )
    return list(result.scalars().all())


async def get_booking_or_404(db: AsyncSession, booking_id: int) -> Booking:
    """Fetch a booking by id, or raise 404."""
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return booking
