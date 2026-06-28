"""Event ORM model."""

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.category import Category
    from app.models.user import User


class EventStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class Event(Base):
    """Maps to the `events` table.

    SQL equivalent:
      CREATE TABLE events (
          id INT AUTO_INCREMENT PRIMARY KEY,
          organizer_id INT NOT NULL,
          category_id INT NOT NULL,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          location VARCHAR(200),
          start_time DATETIME NOT NULL,
          end_time DATETIME NOT NULL,
          max_capacity INT NOT NULL,
          current_participants INT DEFAULT 0,
          cover_image VARCHAR(500) NULL,
          status ENUM('draft','published','cancelled','completed') DEFAULT 'draft',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (organizer_id) REFERENCES users(id),
          FOREIGN KEY (category_id) REFERENCES categories(id)
      );
    """

    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    organizer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    max_capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    current_participants: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    cover_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[EventStatus] = mapped_column(
        SAEnum(EventStatus), default=EventStatus.DRAFT, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    organizer: Mapped["User"] = relationship(back_populates="events", lazy="joined")
    category: Mapped["Category"] = relationship(lazy="joined")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="event", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Event(id={self.id}, title='{self.title}', status='{self.status}')>"
