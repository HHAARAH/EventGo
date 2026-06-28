# EventGo — Campus Event Management Platform

Full-stack web application: FastAPI backend + React SPA frontend.

## Architecture

```
eventgo/          Backend API (FastAPI + MySQL + Redis + Docker)
taskflow/         Frontend SPA (React + TypeScript + Tailwind + Vite)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11+ / FastAPI / SQLAlchemy 2.0 / MySQL 8.0 |
| Auth | JWT (python-jose) + bcrypt + RBAC (user/organizer/admin) |
| Frontend | React 18 / TypeScript / Vite / Tailwind CSS |
| State Management | Zustand |
| Forms | React Hook Form + Zod |
| Drag & Drop | @dnd-kit |
| Testing | Vitest + Testing Library (frontend) / Pytest (backend) |
| Infrastructure | Docker / Docker Compose |
| Cloud Ready | Vercel (frontend) / Railway (backend) |

## Features

- User registration & login (JWT authentication)
- Role-based access: user / organizer / admin
- Browse events with category filtering, keyword search, pagination
- Book / cancel event registrations
- Organizer dashboard — Kanban board with drag-and-drop status management
- Create / edit / delete events, upload cover images
- View participants list
- Notification center
- Light / dark / system theme toggle
- Responsive design (mobile / tablet / desktop)

## Quick Start

```bash
# 1. Start backend
cd eventgo
docker compose up -d
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# → http://localhost:8000/docs

# 2. Start frontend (new terminal)
cd taskflow
npm install
npm run dev
# → http://localhost:5173
```

## Testing

```bash
# Backend
cd eventgo && pytest

# Frontend
cd taskflow && npm test
```

## Deployment

- **Frontend**: Vercel — `taskflow/vercel.json` configured, auto-detect on push
- **Backend**: Railway — `eventgo/Dockerfile` ready, add MySQL plugin after deploy
- See `.env` and `.env.example` for environment variable configuration
