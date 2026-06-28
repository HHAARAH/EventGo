"""Pydantic request/response schemas for user endpoints."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRoleEnum(str, Enum):
    USER = "user"
    ORGANIZER = "organizer"
    ADMIN = "admin"


# ── Request schemas ──────────────────────────────────────────────

class UserRegister(BaseModel):
    """Schema for POST /api/auth/register."""
    name: str = Field(min_length=1, max_length=100, examples=["Zhang San"])
    email: EmailStr = Field(examples=["zhangsan@example.com"])
    password: str = Field(
        min_length=6,
        max_length=128,
        examples=["mysecret123"],
        description="Plaintext password; will be bcrypt-hashed before storage.",
    )

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("name must not be blank")
        return stripped


class UserLogin(BaseModel):
    """Schema for POST /api/auth/login."""
    email: EmailStr = Field(examples=["zhangsan@example.com"])
    password: str = Field(min_length=1, examples=["mysecret123"])


class UserUpdate(BaseModel):
    """Schema for PUT /api/auth/me."""
    name: str | None = Field(default=None, min_length=1, max_length=100)
    avatar_url: str | None = Field(default=None, max_length=500)


# ── Response schemas ─────────────────────────────────────────────

class UserResponse(BaseModel):
    """Public user profile returned in API responses."""
    id: int
    name: str
    email: str
    role: UserRoleEnum
    avatar_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """Returned after successful login or registration."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
