"""Pydantic request/response schemas for category endpoints."""

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    """Schema for POST /api/categories."""
    name: str = Field(min_length=1, max_length=50)
    slug: str = Field(min_length=1, max_length=50, pattern=r"^[a-z0-9-]+$")


class CategoryResponse(BaseModel):
    """Category returned in API responses."""
    id: int
    name: str
    slug: str

    model_config = {"from_attributes": True}
