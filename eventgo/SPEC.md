# EventGo — Campus Event Management & Booking Platform

> Backend-only project · Python + FastAPI + MySQL  
> Portfolio project · Learning objectives: REST API design, database engineering, authentication, async tasks, deployment

---

## 1. Project Overview

EventGo is a **backend service for a campus event booking system**. It provides a complete REST API supporting three user roles (admin, organizer, user) to publish, browse, book, and manage events.

**No frontend.** The built-in Swagger UI (`/docs`) and ReDoc (`/redoc`) serve as the interactive interface.

### Learning Objectives

| Domain | Skills Acquired |
|--------|----------------|
| API Design | RESTful conventions, route layering, request/response modeling |
| Databases | MySQL schema design, SQLAlchemy ORM, transactions, row-level locking |
| Auth & Security | JWT issuance/verification, bcrypt hashing, RBAC |
| Async Processing | Celery task queues, async email delivery |
| Engineering Practices | Layered architecture, env var management, Git workflow |
| Testing | pytest + httpx async API testing |
| Deployment | Docker + docker-compose, GitHub Actions CI/CD |

---

## 2. Tech Stack

```
Language:     Python 3.11+
Framework:    FastAPI (async web framework)
ORM:          SQLAlchemy 2.0 (async mode)
Database:     MySQL 8.0
Migrations:   Alembic
Auth:         python-jose (JWT) + passlib (bcrypt)
Async Queue:  Celery + Redis
Email:        aiosmtplib
Testing:      pytest + pytest-asyncio + httpx
API Docs:     FastAPI built-in Swagger UI + ReDoc
Deployment:   Docker + docker-compose + NGINX
CI/CD:        GitHub Actions (auto pytest on push)
```

---

## 3. Database Design

### 3.1 Entity-Relationship

```
users 1 ──── N bookings N ──── 1 events
                    │
              N ──── 1 users (participant)

events N ──── 1 categories
events 1 ──── N notifications

users 1 ──── N notifications
```

### 3.2 Five Core Tables

**users**
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | Primary key |
| name | VARCHAR(100) | Display name |
| email | VARCHAR(255) UNIQUE | Login credential |
| password_hash | VARCHAR(255) | bcrypt hash |
| role | ENUM('user','organizer','admin') | Default 'user' |
| avatar_url | VARCHAR(500) NULL | Avatar image |
| created_at | DATETIME | Registration time |
| updated_at | DATETIME | Last update |

**categories**
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | Primary key |
| name | VARCHAR(50) | Category name (Academic/Sports/Club...) |
| slug | VARCHAR(50) UNIQUE | URL-friendly identifier |
| created_at | DATETIME | Creation time |

**events**
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | Primary key |
| organizer_id | INT FK -> users.id | Event creator |
| category_id | INT FK -> categories.id | Category |
| title | VARCHAR(200) | Event title |
| description | TEXT | Event details |
| location | VARCHAR(200) | Venue |
| start_time | DATETIME | Start time |
| end_time | DATETIME | End time |
| max_capacity | INT | Maximum participants |
| current_participants | INT DEFAULT 0 | Current booking count |
| cover_image | VARCHAR(500) NULL | Cover image URL |
| status | ENUM('draft','published','cancelled','completed') | Status |
| created_at | DATETIME | Creation time |
| updated_at | DATETIME | Last update |

> `current_participants` is a denormalized counter — avoids COUNT(bookings) on every read. This is a common optimization in production systems.

**bookings**
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | Primary key |
| user_id | INT FK -> users.id | Booking user |
| event_id | INT FK -> events.id | Event |
| status | ENUM('confirmed','cancelled') | Booking status |
| booked_at | DATETIME | Booking time |
| cancelled_at | DATETIME NULL | Cancellation time |
| UNIQUE KEY | (user_id, event_id, status) | Prevents duplicate bookings |

**notifications**
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | Primary key |
| user_id | INT FK -> users.id | Recipient |
| type | VARCHAR(50) | Notification type |
| title | VARCHAR(200) | Title |
| content | TEXT | Body |
| is_read | BOOLEAN DEFAULT FALSE | Read status |
| created_at | DATETIME | Creation time |

---

## 4. API Endpoints

### 4.1 Authentication `/api/auth`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/auth/register` | None | Register new user |
| POST | `/api/auth/login` | None | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Get current user info |
| PUT | `/api/auth/me` | JWT | Update profile |

### 4.2 Events `/api/events`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/events` | None | List events (pagination + search + filter) |
| GET | `/api/events/{id}` | None | Event detail |
| POST | `/api/events` | JWT(organizer/admin) | Create event |
| PUT | `/api/events/{id}` | JWT(organizer/admin) | Update event |
| DELETE | `/api/events/{id}` | JWT(organizer/admin) | Soft-delete event |
| POST | `/api/events/{id}/cover` | JWT(organizer/admin) | Upload cover image |

### 4.3 Bookings `/api/bookings`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/events/{id}/book` | JWT | Book event (concurrency-safe) |
| DELETE | `/api/bookings/{id}` | JWT | Cancel booking |
| GET | `/api/bookings/my` | JWT | My bookings |
| GET | `/api/events/{id}/participants` | JWT(organizer/admin) | Participant list |

### 4.4 Notifications `/api/notifications`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/notifications` | JWT | My notifications |
| PUT | `/api/notifications/{id}/read` | JWT | Mark as read |
| PUT | `/api/notifications/read-all` | JWT | Mark all as read |

### 4.5 Categories `/api/categories`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/categories` | None | List categories |
| POST | `/api/categories` | JWT(admin) | Create category |

---

## 5. Module Breakdown (Learning Order)

### Module 1: Project Scaffolding
- Directory structure
- FastAPI application entry point
- SQLAlchemy database connection
- `.env` environment management
- Docker dev environment (MySQL + Redis)
- Git initialization

### Module 2: User Authentication
- User data model + Alembic migration
- Registration endpoint (Pydantic validation + bcrypt)
- Login endpoint (JWT issuance)
- JWT verification dependency (`get_current_user`)
- Profile query/update

### Module 3: Event CRUD
- Event + Category data models
- Create/edit/delete events (with permission checks)
- List query: pagination + category filter + keyword search
- Cover image upload

### Module 4: Booking System (Core)
- Booking data model
- Book endpoint: transaction + `SELECT ... FOR UPDATE` (prevents overselling)
- Status checks: capacity full / duplicate booking / event status
- Cancel booking + capacity rollback
- My bookings + participant list

### Module 5: Async Notifications
- Notification data model
- Celery configuration (Redis broker)
- Booking confirmation email (async)
- In-app notification records
- Notification list + read marking

### Module 6: Testing & Deployment
- API documentation polish (descriptions, examples)
- pytest test cases (auth/booking/edge cases)
- Dockerfile + docker-compose production config (prior experience, quick review)
- GitHub Actions CI/CD: auto pytest on push to main
- README.md (setup steps, API overview, tech highlights)

---

## 6. Learning Roadmap (~5 weeks, accounting for prior experience)

```
Week 1 -> Module 1+2: Scaffolding + User Auth
Week 2 -> Module 3: Event CRUD
Week 3 -> Module 4: Booking System (focus week)
Week 4 -> Module 5: Async Notifications (Celery + Redis)
Week 5 -> Module 6: Testing + Docker (quick review) + CI/CD
```

> Docker is marked as "prior experience" — ~0.3 weeks for quick consolidation (DocuMind already covered this).  
> CI/CD is a new addition (GitHub Actions auto pytest), not covered by either prior project.  
> Detailed daily task lists are provided incrementally, not all at once.

---

## 7. Development Standards

### Git Commit Convention
```
feat: New feature (feat: implement user registration endpoint)
fix: Bug fix
docs: Documentation changes
refactor: Code refactoring
test: Testing related
chore: Build/config changes
```

### Code Style
- Follow PEP 8
- Mandatory type annotations (FastAPI + Pydantic depend on type inference)
- Docstrings on functions and classes (Google style)
- Naming: snake_case for files, PascalCase for classes

### Directory Structure
```
eventgo/
├── app/
│   ├── main.py              # FastAPI entry point, mounts all routers
│   ├── config.py            # Settings class (pydantic-settings)
│   ├── database.py          # Engine + session factory
│   ├── models/              # SQLAlchemy ORM models (one per table)
│   ├── schemas/             # Pydantic request/response models
│   ├── routers/             # API routes (split by resource)
│   ├── services/            # Business logic layer
│   ├── middleware/          # Custom middleware
│   ├── tasks/               # Celery async tasks
│   └── utils/               # Utility functions
├── tests/                   # Test files
├── alembic/                 # DB migrations
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 8. Acceptance Criteria

### Functional Completeness
- [ ] User registration, login, profile view/update
- [ ] Organizer can create, edit, delete events
- [ ] User can browse, search, filter events
- [ ] User can book events (concurrency-safe)
- [ ] User can cancel bookings
- [ ] Booking confirmation email sent
- [ ] In-app notification records

### Code Quality
- [ ] Type annotations on key business logic
- [ ] Unit tests for booking module
- [ ] Integration tests for auth module
- [ ] Unified error handling (HTTPException + custom error codes)

### Engineering Standards
- [ ] `docker-compose up` starts the full environment (prior experience, quick review)
- [ ] GitHub Actions CI pipeline (auto test on push)
- [ ] Swagger docs accessible at `localhost:8000/docs`
- [ ] README includes setup steps, tech stack, API overview
- [ ] Clean Git history with meaningful commit messages

---

## Appendix: Future Extensions (post-project)

- [ ] Event rating/review system
- [ ] QR code check-in via WeChat
- [ ] Payment integration (registration fees)
- [ ] GraphQL endpoint (for learning)
- [ ] Kubernetes deployment config
- [ ] Prometheus + Grafana monitoring

> These are nice-to-haves. Ship the core 6 modules first — they already make a strong portfolio.
