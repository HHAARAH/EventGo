"""Authentication routes: register and login."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import TokenResponse, UserLogin, UserRegister
from app.services.auth_service import authenticate_user, create_access_token, create_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user account.

    Request body:
        {"name": "Zhang San", "email": "zs@example.com", "password": "mysecret"}

    Behind the scenes:
        1. Pydantic validates email format and password length.
        2. Email uniqueness is checked (409 Conflict if taken).
        3. Password is bcrypt-hashed (plaintext never stored).
        4. User row is INSERTed into the users table.
        5. A JWT is issued so the user is logged in immediately.

    Returns:
        201 Created with access_token, token_type, and user profile.
    """
    user = await create_user(db, data)
    await db.refresh(user)  # Load server-generated values (created_at, updated_at)
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=user)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate and return a JWT.

    Request body:
        {"email": "zs@example.com", "password": "mysecret"}

    Behind the scenes:
        1. SELECT the user by email from the users table.
        2. bcrypt-verify the plaintext password against the stored hash.
        3. If either step fails, return 401 (same message for both —
           prevents email enumeration attacks).

    Returns:
        200 OK with access_token, token_type, and user profile.
    """
    user = await authenticate_user(db, data.email, data.password)
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=user)
