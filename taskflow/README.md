# EventGo Frontend

Campus Event Management & Booking Platform — React SPA frontend, connected to the EventGo FastAPI backend.

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 18 + TypeScript |
| Bundler | Vite |
| Styling | Tailwind CSS (light/dark/system themes) |
| State | Zustand |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| Drag & Drop | @dnd-kit |
| Testing | Vitest + Testing Library |
| HTTP | Native fetch + JWT Bearer Token |

## Features

- **Event Browsing**: Home page event cards, category filtering, keyword search, pagination
- **Auth System**: Register / Login (JWT), profile editing
- **Event Booking**: Book / cancel events, view my bookings
- **Notifications**: System notifications, mark as read
- **Organizer Board**: Kanban-style event management, drag-and-drop to change status
- **Event Management**: Create / edit / delete events, view participants
- **Theme Toggle**: Light / Dark / System three-mode switch
- **Responsive**: Mobile / Tablet / Desktop adaptive layout

## Local Development

```bash
# 1. Start EventGo backend
cd ../eventgo
docker compose up -d
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 2. Start frontend (new terminal)
cd taskflow
npm install
npm run dev
# → http://localhost:5173
```

## Testing

```bash
npm test          # Run all tests (15 passing)
npm run build     # Production build
```

## Deployment

The project includes `vercel.json` for Vercel deployment. Point API requests to a running EventGo backend:

```ts
// Dev: Vite proxy forwards /api → localhost:8000
// Prod: set environment variable
const API_BASE = import.meta.env.PROD ? 'https://your-backend.com' : '/api';
```

## Project Structure

```
src/
├── api/client.ts          # Fetch wrapper + JWT management
├── components/
│   ├── events/EventForm.tsx
│   ├── layout/            # Header, MobileNav, AppLayout
│   └── ui/ThemeToggle.tsx
├── hooks/index.ts         # useApi, useDebounce
├── pages/                 # 11 page components
├── stores/                # useThemeStore, useAuthStore
├── test/                  # Test files (15 tests)
├── types/index.ts         # TypeScript type definitions
└── utils/index.ts         # Utility functions
```
