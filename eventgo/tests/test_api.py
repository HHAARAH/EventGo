"""Integration tests for EventGo API.

Run with: pytest tests/ -v
Requires MySQL and Redis running (docker-compose up -d mysql redis).
"""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.database import Base, engine
from app.main import app

# Import all models so Base.metadata.create_all knows about them
from app.models import booking, category, event, notification, user  # noqa: F401


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """Create tables before each test module, drop them after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    """Async HTTP test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ── Auth Tests ────────────────────────────────────────────────────

class TestAuth:
    """Test user registration and login."""

    @pytest.mark.asyncio
    async def test_register_success(self, client: AsyncClient):
        response = await client.post("/api/auth/register", json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "secret123",
        })
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["role"] == "user"

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient):
        await client.post("/api/auth/register", json={
            "name": "User A", "email": "dup@example.com", "password": "secret123",
        })
        response = await client.post("/api/auth/register", json={
            "name": "User B", "email": "dup@example.com", "password": "another123",
        })
        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_register_invalid_email(self, client: AsyncClient):
        response = await client.post("/api/auth/register", json={
            "name": "No Email", "email": "not-an-email", "password": "secret123",
        })
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient):
        await client.post("/api/auth/register", json={
            "name": "Login Test", "email": "login@example.com", "password": "secret123",
        })
        response = await client.post("/api/auth/login", json={
            "email": "login@example.com", "password": "secret123",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient):
        await client.post("/api/auth/register", json={
            "name": "Wrong PW", "email": "wrong@example.com", "password": "secret123",
        })
        response = await client.post("/api/auth/login", json={
            "email": "wrong@example.com", "password": "WRONG",
        })
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_me(self, client: AsyncClient):
        resp = await client.post("/api/auth/register", json={
            "name": "Me Test", "email": "me@example.com", "password": "secret123",
        })
        token = resp.json()["access_token"]
        response = await client.get(
            "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert response.json()["email"] == "me@example.com"

    @pytest.mark.asyncio
    async def test_get_me_no_token(self, client: AsyncClient):
        response = await client.get("/api/auth/me")
        assert response.status_code == 403  # FastAPI returns 403 when no token


# ── Event Tests ───────────────────────────────────────────────────

class TestEvents:
    """Test event CRUD operations."""

    async def _register_and_login(self, client: AsyncClient, email: str, role: str = "user"):
        resp = await client.post("/api/auth/register", json={
            "name": email, "email": email, "password": "secret123",
        })
        return resp.json()["access_token"]

    @pytest.mark.asyncio
    async def test_create_event_requires_auth(self, client: AsyncClient):
        response = await client.post("/api/events", json={
            "title": "Unauthorized Event",
            "start_time": "2026-07-01T10:00:00",
            "end_time": "2026-07-01T12:00:00",
            "max_capacity": 50,
            "category_id": 1,
        })
        assert response.status_code == 403  # No token

    @pytest.mark.asyncio
    async def test_list_events_empty(self, client: AsyncClient):
        response = await client.get("/api/events")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["items"] == []

    @pytest.mark.asyncio
    async def test_list_events_with_pagination(self, client: AsyncClient):
        response = await client.get("/api/events?page=1&page_size=10")
        assert response.status_code == 200


# ── Booking Tests ─────────────────────────────────────────────────

class TestBookings:
    """Test booking system with concurrency safety."""

    async def _setup(self, client: AsyncClient):
        """Create an admin, a category, and an event; return tokens."""
        # Register admin
        resp = await client.post("/api/auth/register", json={
            "name": "Admin", "email": "admin@test.com", "password": "admin123",
        })
        admin_token = resp.json()["access_token"]

        # Manually set role to admin (test helper — in prod this would be done differently)
        from app.database import async_session
        from app.models.user import User, UserRole
        async with async_session() as db:
            result = await db.execute(
                __import__("sqlalchemy").select(User).where(User.email == "admin@test.com")
            )
            admin_user = result.scalar_one()
            admin_user.role = UserRole.ADMIN
            await db.commit()

        # Create category
        await client.post("/api/categories", json={
            "name": "Sports", "slug": "sports",
        }, headers={"Authorization": f"Bearer {admin_token}"})

        # Create event
        resp = await client.post("/api/events", json={
            "title": "Basketball Tournament",
            "description": "3v3 match",
            "start_time": "2026-07-15T10:00:00",
            "end_time": "2026-07-15T18:00:00",
            "max_capacity": 2,
            "category_id": 1,
            "status": "published",
        }, headers={"Authorization": f"Bearer {admin_token}"})
        event = resp.json()

        # Register a normal user
        resp = await client.post("/api/auth/register", json={
            "name": "Normal User", "email": "user@test.com", "password": "user123",
        })
        user_token = resp.json()["access_token"]

        return admin_token, user_token, event

    @pytest.mark.asyncio
    async def test_book_event(self, client: AsyncClient):
        _, user_token, event = await self._setup(client)
        response = await client.post(
            f"/api/events/{event['id']}/book",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["message"] == "Booking confirmed"

    @pytest.mark.asyncio
    async def test_cannot_double_book(self, client: AsyncClient):
        _, user_token, event = await self._setup(client)
        await client.post(
            f"/api/events/{event['id']}/book",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        response = await client.post(
            f"/api/events/{event['id']}/book",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_cannot_book_full_event(self, client: AsyncClient):
        admin_token, _, event = await self._setup(client)

        # Register two more users and book the event (capacity = 2)
        for i in range(2):
            resp = await client.post("/api/auth/register", json={
                "name": f"User{i}", "email": f"user{i}@test.com", "password": "pass123",
            })
            token = resp.json()["access_token"]
            await client.post(
                f"/api/events/{event['id']}/book",
                headers={"Authorization": f"Bearer {token}"},
            )

        # Third user should get 409
        resp = await client.post("/api/auth/register", json={
            "name": "User3", "email": "user3@test.com", "password": "pass123",
        })
        token3 = resp.json()["access_token"]
        response = await client.post(
            f"/api/events/{event['id']}/book",
            headers={"Authorization": f"Bearer {token3}"},
        )
        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_cancel_booking(self, client: AsyncClient):
        _, user_token, event = await self._setup(client)
        resp = await client.post(
            f"/api/events/{event['id']}/book",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        booking_id = resp.json()["booking_id"]
        response = await client.delete(
            f"/api/bookings/{booking_id}",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Booking cancelled"
