# EventGo — Campus Event Management Platform

Full-stack web application: FastAPI backend + React SPA frontend.

```
eventgo/          Backend API (FastAPI + SQLAlchemy + MySQL + Docker)
taskflow/         Frontend SPA (React 18 + TypeScript + Tailwind + Vite)
```

---

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker (for MySQL)

### Backend 

```bash
cd eventgo

# Start MySQL via Docker
docker compose up -d

# Create environment file (edit passwords if needed)
cp .env.example .env

# Install dependencies and run
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# API docs → http://localhost:8000/docs
```

### Frontend 

```bash
cd taskflow

npm install
npm run dev

# App → http://localhost:5173
```

Vite's dev server proxies `/api/*` requests to `localhost:8000`. No CORS config needed for local dev.

### Create admin account

```bash
# Connect to local MySQL
docker exec -it eventgo-mysql mysql -u root -peventgo_dev eventgo

# Register via the web UI first, then promote:
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

### Create categories & events

Open `http://localhost:8000/docs` → POST `/api/auth/login` → click Authorize → fill token → POST `/api/categories`:

```json
{"name": "Sports", "slug": "sports"}
{"name": "Workshop", "slug": "workshop"}
{"name": "Music", "slug": "music"}
```

Then POST `/api/events` or use the frontend's "New Event" button (visible to admin/organizer).

### Ports

| Service | Port | Notes |
|---------|------|-------|
| Backend (uvicorn) | `8000` | Configured in `vite.config.ts` proxy target |
| Frontend (Vite) | `5173` | Vite default |
| MySQL (Docker) | `3306` | Mapped from container |

All ports are defaults. Override via environment variables or command-line flags.

---

## Cloud Deployment

Here using Vercel and Railway

### Step 1: Deploy Frontend

1. Sign up at [vercel.com](https://vercel.com) with GitHub
2. **New Project** → Import your repo
3. Set **Root Directory** = `taskflow`
4. Go to Settings → Environment Variables → add (You may generate the domain in Railway first):

   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE` | `https://your-backend-domain/api` |


### Step 3: Deploy Backend

1. Sign up at [railway.app](https://railway.app) with GitHub
2. **New Project** → **Deploy from GitHub** → select your repo
3. Railway auto-detects `railway.json` which points to `eventgo/Dockerfile`
4. After build, click **+ New** → **Database** → **Add MySQL**
5. Go to Service → Variables → add:

   | Key | Value |
   |-----|-------|
   | `JWT_SECRET` | random 32+ character string |
   | `SECRET_KEY` | random 32+ character string |
   | `MYSQL_URL` | MySQL service reference |
   | `ALLOWED_ORIGINS` | `https://your-frontend-domain/` |


### Step 4: Promote to admin

1. From Railway MySQL service → Variables → copy MYSQL_PUBLIC_URL and Connect from your terminal

2. Use Railway MySQL service
 
`UPDATE users SET role = 'admin' WHERE email = 'you@example.com';`


### Step 5: Create categories

Open your Railway domain's Swagger (`/docs`) → login → POST `/api/categories` to create categories. Or use the admin account to create categories from the frontend.

---

## Configuration Reference

### Backend environment variables

| Variable | Default | Cloud | 
|----------|----------------|-------|
| `DB_HOST` | localhost | (not needed) |
| `DB_USER` | root | (not needed) | 
| `DB_PASSWORD` | eventgo_dev | (not needed) | 
| `DB_NAME` | eventgo | railway | 
| `MYSQL_URL` | (empty) | Railway-injected | 
| `JWT_SECRET` | random string | random string | 
| `SECRET_KEY` | random string | random string | 
| `ALLOWED_ORIGINS` | (defaults to localhost) | Vercel domain | 
| `APP_ENV` | development | production | 

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11+ / FastAPI / SQLAlchemy 2.0 / MySQL 8.0 |
| Auth | JWT (python-jose) + bcrypt + RBAC (user/organizer/admin) |
| Frontend | React 18 / TypeScript / Vite / Tailwind CSS |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Drag & Drop | @dnd-kit |
| Testing | Vitest + Testing Library |
| Infrastructure | Docker / Docker Compose |

## Features

- User registration & login (JWT)
- Role-based access: user / organizer / admin
- Event browsing with category filtering, keyword search, pagination
- Book / cancel event registrations
- Organizer Kanban board with drag-and-drop status management
- Create / edit / delete events, upload cover images
- View participants
- Notification center (mark read / mark all read)
- Light / dark / system theme toggle
- Responsive design

## Testing

```bash
# Frontend (15 tests)
cd taskflow && npm test

# Backend
cd eventgo && pytest
```
