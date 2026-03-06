# Backend

Multi-tenant SaaS backend: FastAPI, PostgreSQL, Redis, Docker.

## Structure

- **`app/`** – Main application package
- **`app/api/`** – HTTP boundary (routers, deps, v1 routes)
- **`app/core/`** – Config, security, logging, tenancy, exceptions
- **`app/db/`** – Session, models, repositories, migrations
- **`app/schemas/`** – Pydantic DTOs
- **`app/services/`** – Business logic layer
- **`app/integrations/`** – Redis and external adapters
- **`app/middlewares/`** – Tenant context, request-id, rate limit
- **`app/workers/`** – Background tasks and scheduler
- **`app/utils/`** – Shared helpers
- **`tests/`** – Unit, integration, e2e, fixtures
- **`scripts/`** – Operational scripts
- **`docker/`** – API, worker, nginx assets

## Tenancy

Choose before implementing features:

- **Row-level**: `tenant_id` on tables; single schema; simple, good default.
- **Schema-per-tenant**: One PostgreSQL schema per tenant; stronger isolation, more operational complexity.

Configuration and resolution live in `app/core/tenancy.py` and `app/api/deps`.

## Run locally

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL and REDIS_URL

pip install -e ".[dev]"
uvicorn app.main:app --reload
```

## Docker

**Full stack (backend + frontend):** From the **repo root**, run:

```bash
docker compose up --build
```

API at http://localhost:8000, frontend at http://localhost:3000. Use `backend/.env` (copy from `.env.example`) with `DATABASE_URL` and `REDIS_URL` using hostnames `postgres` and `redis` when running via root compose. The API container runs **Alembic migrations** (`alembic upgrade head`) on startup before serving traffic, so the database schema is applied automatically.

**Backend only** (from this directory):

```bash
docker compose up -d postgres redis
# Run API locally against them, or:
docker compose up api
```

## Production

- Use `env_file: .env` or inject env from your deployment system; never commit a production `.env`.
- Prefer Docker secrets or a vault for `POSTGRES_PASSWORD` and `SECRET_KEY` when possible.
- Run with production overrides (no host ports for DB/Redis, stricter limits):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

- Set `APP_ENV=production`, `DEBUG=false`, and a strong `SECRET_KEY` in production.

## Migrations

- **Docker:** The API service runs `alembic upgrade head` on startup, so schema is applied when you `docker compose up`. No separate migration step is required for normal runs.
- **Manual (new revisions or local DB):** From `backend/` with `DATABASE_URL` set (sync URL is used by Alembic via `env.py`):

```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```

Ensure `app/db/migrations/env.py` is set up to use your `Base` and `DATABASE_URL` from config.
