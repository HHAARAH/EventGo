# EventGo — Campus Event Management & Booking API

A backend REST API for managing campus events and bookings, built with FastAPI, SQLAlchemy, MySQL, and Redis.

**Portfolio project** — demonstrates REST API design, database engineering, JWT authentication, concurrency-safe booking, async task queues, and Docker deployment.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | FastAPI (async) |
| ORM | SQLAlchemy 2.0 |
| Database | MySQL 8.0 |
| Cache/Queue | Redis 7 |
| Auth | JWT + bcrypt |
| Async Tasks | Celery |
| Testing | pytest + HTTPX |
| CI/CD | GitHub Actions |
| Container | Docker + docker-compose |

## Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Desktop

### 1. Clone and setup

```bash
git clone <repo-url>
cd eventgo
cp .env.example .env
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### 2. Start infrastructure (MySQL + Redis)

```bash
docker compose up -d mysql redis
```

Wait ~15 seconds for MySQL to finish initializing.

### 3. Run the API server

```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Open API docs

Visit `http://localhost:8000/docs` — Swagger UI with interactive API testing.

Visit `http://localhost:8000/redoc` — ReDoc documentation.

### Full Docker deployment

```bash
docker compose up -d --build
```

Same Docker setup runs the app, MySQL, and Redis together.

## API Overview

### Authentication
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login, receive JWT
- `GET /api/auth/me` — Get current user profile
- `PUT /api/auth/me` — Update profile

### Events
- `GET /api/events` — List events (paginated, searchable, filterable)
- `GET /api/events/{id}` — Event detail
- `POST /api/events` — Create event (organizer/admin)
- `PUT /api/events/{id}` — Update event (owner/admin)
- `DELETE /api/events/{id}` — Soft-delete event (owner/admin)
- `POST /api/events/{id}/cover` — Upload cover image

### Bookings
- `POST /api/events/{id}/book` — Book an event (concurrency-safe)
- `DELETE /api/bookings/{id}` — Cancel booking
- `GET /api/bookings/my` — My bookings
- `GET /api/events/{id}/participants` — Participant list (organizer/admin)

### Categories
- `GET /api/categories` — List categories
- `POST /api/categories` — Create category (admin)

### Notifications
- `GET /api/notifications` — My notifications
- `PUT /api/notifications/{id}/read` — Mark as read
- `PUT /api/notifications/read-all` — Mark all as read

## Running Tests

```bash
# Start infrastructure first
docker compose up -d mysql redis

# Run tests
pytest tests/ -v
```

## Project Structure

```
eventgo/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Settings (env vars)
│   ├── database.py          # SQLAlchemy engine + session
│   ├── models/              # ORM models
│   ├── schemas/             # Pydantic request/response schemas
│   ├── routers/             # API routes
│   ├── services/            # Business logic
│   ├── middleware/          # JWT auth middleware
│   ├── tasks/               # Celery async tasks
│   └── utils/               # Utilities
├── tests/                   # pytest tests
├── .github/workflows/       # CI/CD
├── docker-compose.yml       # Docker orchestration
├── Dockerfile               # App container
└── requirements.txt         # Python dependencies
```

## Key Technical Highlights

**Concurrency-safe booking** — Uses `SELECT ... FOR UPDATE` row-level locking with database transactions to prevent overselling when multiple users book the last spot simultaneously.

**JWT authentication chain** — `HTTPBearer → decode → get_current_user → get_current_organizer/admin` dependency injection chain with proper 401/403 separation.

**Layered architecture** — Routes (HTTP layer) → Services (business logic) → Models (data layer), following separation of concerns.

## License

MIT
