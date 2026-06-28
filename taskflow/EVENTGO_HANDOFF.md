# EventGo Frontend — Project Handoff

> Backend repo: `Software_Development/eventgo/`
> Backend status: **Complete** — 24 API endpoints, 5 tables, JWT auth, concurrency-safe booking
> Frontend target: Taskflow team

---

## 1. What This Backend Does

EventGo is a campus event booking platform. Three user roles:

| Role | Can do |
|------|--------|
| `user` | Browse events, book, cancel, view own bookings, get notifications |
| `organizer` | All of user + create/edit/delete events, view participants |
| `admin` | All of organizer + create categories |

---

## 2. How to Connect

The backend runs locally. Start it:

```bash
cd eventgo
docker compose up -d           # start mysql + redis
uvicorn app.main:app --reload  # start api on localhost:8000
```

All API responses are JSON. Auth uses `Authorization: Bearer <jwt_token>` header.

**Swagger docs** at `http://localhost:8000/docs` — you can test every endpoint live.

**OpenAPI JSON** at `http://localhost:8000/openapi.json` — auto-generate frontend API clients from this.

---

## 3. Auth Flow

```
1. POST /api/auth/register   → get JWT + user info
2. POST /api/auth/login      → get JWT + user info
3. Store token (localStorage), attach to all subsequent requests
4. GET /api/auth/me          → get current user (verify token works)
5. PUT /api/auth/me          → update name/avatar
```

Token expires in 24 hours. When a request returns 401, redirect to login.

---

## 4. API Reference (grouped by UI page)

### 4.1 Register / Login

```
POST /api/auth/register
  Body:   {"name": "Zhang San", "email": "zs@qq.com", "password": "123456"}
  Return: 201 {access_token, token_type, user: {id, name, email, role, avatar_url, created_at}}

POST /api/auth/login
  Body:   {"email": "zs@qq.com", "password": "123456"}
  Return: 200 {access_token, token_type, user: {...}}
  401 if wrong credentials
```

### 4.2 Profile

```
GET /api/auth/me          → 200 {id, name, email, role, avatar_url, created_at}
PUT /api/auth/me          → body: {name?, avatar_url?} (partial update)
                           → 200 updated user
```

### 4.3 Event List (home page)

```
GET /api/events
  Query params (all optional):
    page=1        (default)
    page_size=20  (max 100)
    keyword=篮球   (searches title & description)
    category=sports (filter by category slug)
    status=published (default: published + completed)

  Return: 200 {
    items: [{id, title, description, location, start_time, end_time,
             max_capacity, current_participants, cover_image,
             status, category: {id, name, slug},
             organizer: {id, name, email, ...}}],
    total, page, page_size
  }
```

### 4.4 Event Detail

```
GET /api/events/{id}
  Return: 200 {...event fields...}

POST /api/events/{id}/book    (requires JWT)
  Return: 201 {message: "Booking confirmed", booking_id: 123}
  400 if event not published
  409 if already booked OR event full

POST /api/events/{id}/cover   (organizer/admin)
  Body: multipart/form-data with file field
  Return: 200 event with cover_image URL
```

### 4.5 Create/Edit Event (organizer page)

```
POST /api/events   (organizer/admin)
  Body: {
    title, description?, location?, start_time, end_time,
    max_capacity, category_id, status? ("draft"|"published")
  }
  Return: 201 {event}

PUT /api/events/{id}   (owner or admin)
  Body: same shape, all fields optional (partial update)
  Return: 200 {event}

DELETE /api/events/{id}   (owner or admin)
  Return: 204 No Content
```

### 4.6 My Bookings

```
GET /api/bookings/my?page=1&page_size=20
  Return: 200 [{id, user_id, event_id, status, booked_at,
                cancelled_at, event: {...event...}}]

DELETE /api/bookings/{id}
  Return: 200 {message: "Booking cancelled", booking_id}
```

### 4.7 Participants (organizer view)

```
GET /api/events/{id}/participants   (organizer/admin)
  Return: 200 [{id, user_id, booked_at, user: {id, name, email}}]
```

### 4.8 Notifications

```
GET /api/notifications?page=1&page_size=20
  Return: 200 [{id, type, title, content, is_read, created_at}]

PUT /api/notifications/{id}/read   → 200
PUT /api/notifications/read-all    → 200
```

### 4.9 Categories

```
GET /api/categories
  Return: 200 [{id, name, slug}]

POST /api/categories   (admin only)
  Body: {name: "Sports", slug: "sports"}
  Return: 201 {category}
```

---

## 5. Frontend Pages to Build

| Page | Route | Data needed | Auth |
|------|-------|------------|:--:|
| Login/Register | `/login` | Auth APIs | No |
| Home (event list) | `/` | GET /api/events + GET /api/categories | No |
| Event detail | `/events/:id` | GET /api/events/:id | No (book requires auth) |
| Create/edit event | `/events/new`, `/events/:id/edit` | POST/PUT /api/events + GET /api/categories | organizer+ |
| My bookings | `/bookings` | GET /api/bookings/my | Yes |
| Participants | `/events/:id/participants` | GET /api/events/:id/participants | organizer+ |
| Notifications | `/notifications` | GET/PUT /api/notifications | Yes |
| Profile | `/profile` | GET/PUT /api/auth/me | Yes |

---

## 6. Database Schema (for reference)

```
users:       id, name, email, password_hash, role(user|organizer|admin), avatar_url, created_at, updated_at
categories:  id, name, slug, created_at
events:      id, organizer_id→users, category_id→categories, title, description, location,
             start_time, end_time, max_capacity, current_participants, cover_image,
             status(draft|published|cancelled|completed), created_at, updated_at
bookings:    id, user_id→users, event_id→events, status(confirmed|cancelled),
             booked_at, cancelled_at, UNIQUE(user_id,event_id,status)
notifications: id, user_id→users, type, title, content, is_read, created_at
```

---

## 7. Important Frontend Behavior Notes

- **Capacity check**: `max_capacity - current_participants` = spots left. Show "已满" when zero.
- **Duplicate booking returns 409** — show "你已经预约过了" rather than a generic error.
- **Event status**: only "published" events can be booked. Draft events should not show up (API filters them out by default).
- **Cover image upload**: use `multipart/form-data`, field name is `file`. Response includes `cover_image` URL — serve from same host, e.g. `/uploads/abc.jpg`.
- **Role check**: After login, read `user.role`. Hide "Create Event" and "Participants" links for plain `user` role.
- **Date/time format**: ISO 8601, e.g. `"2026-07-15T10:00:00"`.

---

## 8. Tech Suggestions for Frontend

Any framework works — here are conventions-friendly picks:

| Approach | Stack | Notes |
|----------|-------|-------|
| Simple SPA | React + Vite + Tailwind | Most job-relevant |
| Lightweight | Vanilla JS + Fetch API | Fastest to build, no framework |
| Meta-framework | Next.js (App Router) | If you want SSR/SEO |

**React snippet for API calls:**

```ts
const API_BASE = "http://localhost:8000";

// Store token
localStorage.setItem("token", data.access_token);

// Auth header helper
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// Fetch events
const res = await fetch(`${API_BASE}/api/events?page=1`);
const { items, total } = await res.json();

// Book event
await fetch(`${API_BASE}/api/events/${id}/book`, {
  method: "POST",
  headers: { ...authHeader(), "Content-Type": "application/json" },
});
```

---

## 9. Running Backend + Frontend Together

Backend serves on `localhost:8000`. Frontend dev server (e.g. Vite on `localhost:5173`) calls the backend directly. No CORS issues during development if you proxy through Vite:

```ts
// vite.config.ts
export default {
  server: {
    proxy: { "/api": "http://localhost:8000" }
  }
};
```

Or configure CORS on the FastAPI side (add to `app/main.py`):

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 10. Files Reference

```
eventgo/
├── SPEC.md          # Full design spec (English)
├── README.md        # Setup & API overview
├── app/
│   ├── main.py      # 24 routes, CORS not yet configured
│   ├── config.py    # Settings (DB, JWT, Redis)
│   ├── database.py  # SQLAlchemy engine
│   ├── models/      # user, event, category, booking, notification
│   ├── schemas/     # Pydantic request/response shapes
│   ├── routers/     # auth, users, events, bookings, categories, notifications
│   ├── services/    # Business logic (booking concurrency control here)
│   └── middleware/auth.py  # JWT + RBAC dependencies
├── tests/test_api.py     # 9 integration tests
└── docker-compose.yml    # MySQL + Redis
```
