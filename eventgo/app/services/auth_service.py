"""Authentication business logic: password hashing, JWT, user CRUD."""

from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import HTTPException, status
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User
from app.schemas.user import UserRegister


def hash_password(plaintext: str) -> str:
    """Hash a plaintext password with bcrypt.

    The hash includes a random salt, so calling this twice with the same
    password produces different output strings.
    """
    return bcrypt.hashpw(
        plaintext.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(plaintext: str, hashed: str) -> bool:
    """Check a plaintext password against a bcrypt hash."""
    return bcrypt.checkpw(
        plaintext.encode("utf-8"), hashed.encode("utf-8")
    )


def create_access_token(user_id: int) -> str:
    """Create a signed JWT containing the user's id.

    SQL equivalent (conceptual): this is NOT stored in the database.
    The token is self-contained — it carries the user_id and expiry,
    signed with JWT_SECRET so tampering is detectable.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> int:
    """Decode and validate a JWT, returning the user_id.

    Raises HTTPException 401 if the token is expired or tampered with.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return int(user_id)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


async def create_user(db: AsyncSession, data: UserRegister) -> User:
    """Register a new user.

    SQL equivalent:
      INSERT INTO users (name, email, password_hash, role)
      VALUES (:name, :email, :hash, 'user');
    """
    # Check duplicate email
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    user = User(
        name=data.name.strip(),
        email=data.email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    await db.flush()  # flush to get the auto-generated id
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    """Validate credentials and return the User.

    SQL equivalent:
      SELECT * FROM users WHERE email = :email;
      -- then verify the password hash in Python
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return user


async def get_user_by_id(db: AsyncSession, user_id: int) -> User:
    """Fetch a user by primary key.

    SQL equivalent:
      SELECT * FROM users WHERE id = :user_id;
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user
