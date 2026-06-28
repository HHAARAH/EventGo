"""Category routes."""

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_admin
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get("", response_model=list[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    """List all categories."""
    result = await db.execute(select(Category).order_by(Category.name))
    return result.scalars().all()


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new category (admin only)."""
    category = Category(name=data.name, slug=data.slug)
    db.add(category)
    await db.flush()
    return category
