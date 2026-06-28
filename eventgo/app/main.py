"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine

# Import all models so Base.metadata knows about every table
from app.models import booking, category, event, notification, user  # noqa: F401

# Import and mount routers
from app.routers import auth, bookings, categories, events, notifications, users  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle events."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print(f"[{settings.APP_NAME}] Started in {settings.APP_ENV} mode")
    yield
    await engine.dispose()
    print(f"[{settings.APP_NAME}] Shut down")


app = FastAPI(
    title=settings.APP_NAME,
    description="Campus Event Management & Booking API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url=None,  # Disabled — ReDoc CDN is often blocked in some regions
)

# CORS — allow frontend dev server and deployed frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "https://eventgo-frontend.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files (cover images)
import os
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Mount routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(events.router)
app.include_router(bookings.router)
app.include_router(notifications.router)


@app.get("/", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "env": settings.APP_ENV,
    }
