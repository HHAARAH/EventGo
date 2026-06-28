"""SQLAlchemy async engine and session factory."""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

engine = create_async_engine(
    settings.async_database_url,
    echo=settings.APP_DEBUG,
    pool_size=10,
    max_overflow=20,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency that yields a database session.

    Each HTTP request gets its own session. If the handler succeeds,
    changes are committed. If an exception occurs, changes are rolled back.
    The session is always returned to the connection pool on exit.
    """
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
