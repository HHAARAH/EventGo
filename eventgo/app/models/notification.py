"""Notification ORM model."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Notification(Base):
    """Maps to the `notifications` table.

    SQL equivalent:
      CREATE TABLE notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(200) NOT NULL,
          content TEXT,
          is_read BOOLEAN DEFAULT FALSE,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
      );
    """

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(50))
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship(lazy="joined")

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, user={self.user_id}, type='{self.type}', read={self.is_read})>"
