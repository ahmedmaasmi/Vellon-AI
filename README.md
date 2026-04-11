# Vellon AI | Smart Notes

Notes that **remember for you**. Capture ideas, get AI summaries, and find anything in seconds—without leaving your notes.

![Vellon AI hero – landing page](<frontend/public/gifs/screen-capture (4).gif>)

## Features

- **Smart notes** – Create and organize notes with tags, favorites, and archive
- **AI summaries** – Summarize notes and extract keywords (OpenRouter)
- **Search** – Find notes quickly
- **Privacy-first** – Your data stays in your stack; optional AI with your own API key

## How it works

![How the app works – dashboard and note flow](<frontend/public/gifs/screen-capture (5).gif>)

## Quick start

### Docker (full stack)

From the repo root, run backend (FastAPI, Postgres, Redis) and frontend (Next.js) together:

```bash
# Copy .env.example to .env and set DATABASE_URL / REDIS_URL if needed (defaults work for local dev).
docker compose up --build
```

The API runs database migrations on startup.

- **Frontend:** http://localhost:3000  
- **API:** http://localhost:8000  

Production (no host ports for DB/Redis):  
`docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`

### Local dev

**Backend:** From `backend/`, copy `backend/.env.example` to `.env`, set `DATABASE_URL` and `REDIS_URL`, then:

```bash
cd backend
# Start Postgres + Redis (e.g. via root docker compose or locally), then:
alembic upgrade head && uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**API URL for local Next.js:** `next dev` reads env files from **`frontend/`** only (e.g. [`frontend/.env.local`](frontend/.env.local), [`frontend/.env.example`](frontend/.env.example)). A `NEXT_PUBLIC_API_URL` in the **repo root** `.env` is **not** applied to the browser bundle unless you copy it into `frontend/.env.local`. Match the port to your API (Docker default maps the API to host port **8000**; if you set `API_PORT=8001` in root `.env`, use `http://localhost:8001` here).

## Environment

- **Frontend (local dev):** `NEXT_PUBLIC_API_URL` in `frontend/.env.local` or `frontend/.env` — must match the running API. Root [.env.example](.env.example) is for Docker Compose / backend; copy the URL into `frontend/` when running `npm run dev`.
- **Backend:** `SECRET_KEY`, `DATABASE_URL`, `REDIS_URL`; optional `OPENROUTER_API_KEY` for AI (summarize/keywords/embeddings). See [backend/.env.example](backend/.env.example).

