"""Pydantic request/response schemas for event endpoints."""

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.category import CategoryResponse
from app.schemas.user import UserResponse


class EventCreate(BaseModel):
    """Schema for POST /api/events."""
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None)
    location: str | None = Field(default=None, max_length=200)
    start_time: datetime
    end_time: datetime
    max_capacity: int = Field(ge=1, le=100000)
    category_id: int
    status: str = "draft"


class EventUpdate(BaseModel):
    """Schema for PUT /api/events/{id}. All fields optional (partial update)."""
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    location: str | None = Field(default=None, max_length=200)
    start_time: datetime | None = None
    end_time: datetime | None = None
    max_capacity: int | None = Field(default=None, ge=1, le=100000)
    category_id: int | None = None
    status: str | None = None


class EventResponse(BaseModel):
    """Event returned in API responses."""
    id: int
    organizer_id: int
    organizer: UserResponse | None = None
    category_id: int
    category: CategoryResponse | None = None
    title: str
    description: str | None
    location: str | None
    start_time: datetime
    end_time: datetime
    max_capacity: int
    current_participants: int
    cover_image: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EventListResponse(BaseModel):
    """Paginated event list."""
    items: list[EventResponse]
    total: int
    page: int
    page_size: int
