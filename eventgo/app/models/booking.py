"""Booking ORM model."""

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, UniqueConstraint, func
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
          UNIQUE KEY uq_user_event (user_id, event_id, status),
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (event_id) REFERENCES events(id)
      );

    The UNIQUE constraint on (user_id, event_id, status) prevents a user
    from having multiple 'confirmed' bookings for the same event.
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

    # Composite unique constraint: one active booking per user per event
    __table_args__ = (
        UniqueConstraint("user_id", "event_id", "status", name="uq_user_event_status"),
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="bookings", lazy="joined")
    event: Mapped["Event"] = relationship(back_populates="bookings", lazy="joined")

    def __repr__(self) -> str:
        return f"<Booking(id={self.id}, user={self.user_id}, event={self.event_id}, status='{self.status}')>"
