"""Booking ORM model."""

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.user import User


class BookingStatus(str, Enum):
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class Booking(Base):
    """Maps to the `bookings` table.

    SQL equivalent:
      CREATE TABLE bookings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          event_id INT NOT NULL,
          status ENUM('confirmed','cancelled') NOT NULL,
          booked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          cancelled_at DATETIME NULL,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (event_id) REFERENCES events(id)
      );

    Duplicate confirmed bookings are prevented at the application level
    in create_booking() using SELECT ... FOR UPDATE on the event row.
    """

    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), nullable=False)
    status: Mapped[BookingStatus] = mapped_column(
        SAEnum(BookingStatus), nullable=False
    )
    booked_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # No database-level unique constraint — duplicate-confirmed check is handled
    # at the application level in create_booking() with SELECT ... FOR UPDATE,
    # which provides concurrency safety without blocking re-book-cancel flows.

    # Relationships
    user: Mapped["User"] = relationship(back_populates="bookings", lazy="joined")
    event: Mapped["Event"] = relationship(back_populates="bookings", lazy="joined")

    def __repr__(self) -> str:
        return f"<Booking(id={self.id}, user={self.user_id}, event={self.event_id}, status='{self.status}')>"
