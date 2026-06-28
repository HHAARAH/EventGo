"""Category ORM model."""

from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Category(Base):
    """Maps to the `categories` table.

    SQL equivalent:
      CREATE TABLE categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          slug VARCHAR(50) NOT NULL UNIQUE,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    """

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50))
    slug: Mapped[str] = mapped_column(String(50), unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<Category(id={self.id}, name='{self.name}')>"
