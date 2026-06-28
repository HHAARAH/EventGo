"""User profile routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile.

    Requires a valid JWT in the Authorization header.
    No database query needed — the user was already fetched by get_current_user.

    SQL equivalent:
      SELECT * FROM users WHERE id = :user_id;  -- done inside get_current_user
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the authenticated user's profile.

    Only provided fields are updated (partial update).

    SQL equivalent:
      UPDATE users
      SET name = :name, avatar_url = :avatar_url, updated_at = NOW()
      WHERE id = :user_id;
    """
    if data.name is not None:
        current_user.name = data.name.strip()
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url

    db.add(current_user)  # mark as dirty; SQLAlchemy tracks changes
    await db.flush()
    return current_user
