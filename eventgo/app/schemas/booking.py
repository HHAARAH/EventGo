"""Pydantic request/response schemas for booking endpoints."""

from datetime import datetime

from pydantic import BaseModel

from app.schemas.event import EventResponse
from app.schemas.user import UserResponse


class BookingResponse(BaseModel):
    """Booking returned in API responses."""
    id: int
    user_id: int
    user: UserResponse | None = None
    event_id: int
    event: EventResponse | None = None
    status: str
    booked_at: datetime
    cancelled_at: datetime | None

    model_config = {"from_attributes": True}


class BookingMessage(BaseModel):
    """Simple message response for booking actions."""
    message: str
    booking_id: int | None = None


class ParticipantResponse(BaseModel):
    """Participant in an event."""
    id: int
    user_id: int
    user: UserResponse | None = None
    booked_at: datetime

    model_config = {"from_attributes": True}
