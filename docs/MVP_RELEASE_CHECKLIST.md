# Phase 1 MVP Release Checklist (Staging)

Use this before promoting to staging or a first production deploy.

## Pre-deploy

- [ ] Backend: root `.env` (or env vars) set with `SECRET_KEY`, `DATABASE_URL`, `REDIS_URL`; optional `OPENROUTER_API_KEY` for AI (summarize/keywords/embeddings/generate)
- [ ] Frontend: `NEXT_PUBLIC_API_URL` points to the backend API base URL
- [ ] Database: migrations applied (`alembic upgrade head` in backend)
- [ ] No secrets in repo (keys only in env / `.env`; `.env` in `.gitignore`)

## Docker

- [ ] `docker compose up --build` succeeds at root
- [ ] Health: `GET /health` and `GET /ready` return 200 for API
- [ ] Frontend loads at configured port and can reach API

## Smoke flow

- [ ] Register (org + user) and receive tokens
- [ ] Login with org slug + email + password
- [ ] `GET /api/v1/auth/me` returns current user and role
- [ ] Create a note, list notes, open note, update, delete
- [ ] `GET /api/v1/usage/quota` returns plan, limit, used, remaining
- [ ] Summarize / Extract keywords on a note (if OpenRouter configured); 429 when over quota
- [ ] Generate embeddings on a note (if OpenRouter configured); 429 when over quota

## Tests

- [ ] Backend integration tests pass: `pytest tests/integration -v -m integration` (requires DB + Redis)

## Post-deploy

- [ ] Staging URL for frontend and API documented
- [ ] CORS allows staging frontend origin in API config
