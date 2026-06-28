"""JWT authentication middleware — FastAPI dependency for protected routes."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.services.auth_service import decode_access_token, get_user_by_id

# This tells FastAPI to look for an "Authorization: Bearer <token>" header.
security_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate JWT from the Authorization header, return the User.

    Usage in a route:
        @router.get("/protected")
        async def protected_route(current_user: User = Depends(get_current_user)):
            ...

    If the token is missing, expired, or invalid, a 401 is raised.
    If the user no longer exists, a 404 is raised.
    """
    user_id = decode_access_token(credentials.credentials)
    return await get_user_by_id(db, user_id)


async def get_current_organizer(
    current_user: User = Depends(get_current_user),
) -> User:
    """Require organizer or admin role."""
    if current_user.role not in ("organizer", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organizer or admin privileges required",
        )
    return current_user


async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Require admin role."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user
