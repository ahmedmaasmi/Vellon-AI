# Technical Overview: Fake Google Keep (Vellon AI)

This document describes every technical aspect of the application, from the database and Redis through the backend and frontend.

---

## 1. High-Level Architecture

The app is a **single-user note-taking application** (no organizations/tenants in the current data model). It consists of:

- **Frontend**: Next.js 16 (App Router), React 18, Zustand, Axios, Framer Motion, Tailwind CSS.
- **Backend**: FastAPI, async PostgreSQL (asyncpg), Redis, JWT auth, OpenRouter for AI.
- **Infrastructure**: Docker Compose for development and production; PostgreSQL 16, Redis 7.

Data flow: **Browser → Next.js (port 3000) → FastAPI API (port 8000) → PostgreSQL / Redis**. The frontend calls `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:8000`); CORS allows `http://localhost:3000`.

---

## 2. Database (PostgreSQL)

### 2.1 Technology

- **Engine**: PostgreSQL 16 (Alpine image in Docker).
- **Driver**: `asyncpg` for the FastAPI app (`postgresql+asyncpg://...`).
- **ORM**: SQLAlchemy 2.x with async support (`AsyncSession`, `create_async_engine`).
- **Migrations**: Alembic; migrations live in `backend/app/db/migrations/versions/`. The app runs `alembic upgrade head` on startup in Docker.

### 2.2 Connection and Session

- **Config**: `DATABASE_URL` from env (e.g. `.env`); default `postgresql+asyncpg://user:password@localhost:5432/app`.
- **Engine**: Created in `backend/app/db/session.py` via `create_async_engine(settings.database_url, echo=settings.debug)`.
- **Session factory**: `async_sessionmaker` with `autoflush=False`, `expire_on_commit=False`.
- **Request lifecycle**: Dependency `get_db_session()` yields an `AsyncSession`, commits on success, rollbacks on exception, then closes. Used by all API routes that need DB access.
- **Explicit sessions**: `get_session()` is for use outside request scope (e.g. scripts, workers).

### 2.3 Base and Mixins

- **File**: `backend/app/db/base.py`.
- **Base**: SQLAlchemy `DeclarativeBase` for all models.
- **UUIDPrimaryKeyMixin**: `id` as PostgreSQL UUID, primary key, default `uuid.uuid4`.
- **TimestampMixin**: `created_at` and `updated_at` as timezone-aware `DateTime`, server default and on-update via `func.now()`.

### 2.4 Models

All under `backend/app/db/models/`.

#### User (`user.py`)

- **Table**: `users`.
- **Columns**: `id` (UUID PK), `email` (unique, indexed), `hashed_password`, `role` (string, default `"member"`: owner | admin | member), `display_name`, `avatar_url`, `created_at`, `updated_at`.
- **Relations**: `notes`, `tags` (lazy=`"raise"` to avoid accidental N+1).

#### Note (`note.py`)

- **Table**: `notes`.
- **Columns**: `id` (UUID PK), `user_id` (FK → users.id, CASCADE), `title`, `content` (Text), `source` (default `'web'`), `is_archived`, `is_deleted`, `is_favorite`, `is_pinned`, `sort_order` (Integer, default 0), `created_at`, `updated_at`.
- **Indexes**: `ix_notes_created_at`, `ix_notes_sort_order`.
- **Relations**: `user`, `tags` (many-to-many via `note_tags`).

#### Tag (`tag.py`)

- **Table**: `tags`.
- **Association**: `note_tags` table: `(note_id, tag_id)` composite PK, both FKs CASCADE.
- **Columns**: `id` (UUID PK), `user_id` (FK → users.id, CASCADE), `name`, `created_at`, `updated_at`.
- **Constraint**: `uq_tags_user_name` unique on `(user_id, name)`.
- **Relations**: `user`, `notes` (via `note_tags`).

#### UsageLog (`usage_log.py`)

- **Table**: `usage_logs`.
- **Columns**: `id` (UUID PK), `user_id` (FK → users.id, SET NULL), `action_type` (e.g. `ai_action`, `ai_action_blocked`, `speech_minutes`, `translation`, `telegram`), `quantity`, `metadata` (Text, optional JSON), `created_at`, `updated_at`.
- Used for billing/analytics and blocking events when AI rate limit is exceeded.

### 2.5 Repositories

Data access is encapsulated in repositories; all methods are scoped by `user_id` where applicable.

- **UserRepository** (`db/repositories/user.py`): `get_by_id`, `get_by_email`, `create`.
- **NoteRepository** (`db/repositories/note.py`): `create_note`, `get_note_by_id`, `get_note_by_id_with_tags`, `list_notes` (filters: archived, deleted, favorite, pinned, search `q`, `tag_id`; ordering: `sort_order` asc, `updated_at` desc), `get_note_counts`, `update_note`, `soft_delete_note`, `reorder_notes`. Uses `selectinload(Note.tags)` for list/single note with tags.
- **TagRepository** (`db/repositories/tag.py`): `list_tags`, `get_tag_by_id`, `get_tag_by_name`, `create_tag`, `create_tag_if_not_exists`, `attach_to_note`, `detach_from_note` (note_tags insert/delete).
- **UsageLogRepository** (`db/repositories/usage_log.py`): `log`, `sum_quantity_for_user_period`.

### 2.6 Migrations

- **Alembic**: Config in `backend/alembic.ini`; env in `backend/app/db/migrations/env.py` (uses sync URL for Alembic by replacing `postgresql+asyncpg` with `postgresql`).
- **Versions**: 001 (user + hashed_password), 002 (notes; originally had organization_id, later removed in 008), 003 (note is_deleted), 004 (user role), 005 (organization plan), 006 (usage_logs), 007 (organization stripe_customer_id), 008 (remove organizations), 009 (user avatar_url), 010 (note is_favorite, is_pinned, sort_order; tags and note_tags tables).

---

## 3. Redis

### 3.1 Role

Redis is used for:

1. **Refresh token storage** (JTI allowlist for rotation).
2. **AI response caching** (summaries, keywords, embeddings) with TTL.
3. **Per-user AI usage rate limiting** (per-month counters).
4. **Global IP-based request rate limiting** (middleware).
5. **Pub/sub** (infrastructure present for real-time events; used for signaling, e.g. translation).

### 3.2 Connection and Lifecycle

- **Config**: `REDIS_URL` from env (e.g. `redis://localhost:6379/0`). In Docker: `redis://redis:6379/0`.
- **Client**: `redis.asyncio.Redis` from `Redis.from_url(settings.redis_url)` in `backend/app/integrations/redis/client.py`.
- **Lifecycle**: Created in FastAPI `lifespan` and stored in `app.state.redis`; closed on shutdown via `close_redis_client`. Injected into routes via dependency `get_redis(request)`.

### 3.3 Cache Module (`integrations/redis/cache.py`)

- **set_cache(redis, key, value, ttl_seconds=None)**: SET with optional EX.
- **get_cache(redis, key)**: GET; returns decoded string or None.
- **delete_cache(redis, key)**: DELETE.
- **increment_counter(redis, key, amount=1, ttl_seconds=None)**: INCRBY; optionally set TTL; returns new value.

### 3.4 Auth Usage (Refresh Tokens)

- **Prefix**: `refresh:`.
- **Key**: `refresh:{jti}`. Value: `"1"`. TTL: `refresh_token_expires_days * 86400`.
- On register/login/refresh: new refresh JWT is created with a new JTI; JTI is stored in Redis. On refresh: incoming JWT’s JTI is consumed (get + delete); if missing or invalid, refresh fails. New refresh token and JTI are issued and stored. This implements refresh token rotation and revocation.

### 3.5 AI Caching

- **Keys**: `summarize:{note_id}`, `keywords:{note_id}`, `embedding:{note_id}`.
- **TTL**: `settings.ai_cache_ttl_seconds` (default 3600). Summaries and keywords are JSON where needed (keywords as JSON array).
- On note update (title/content change), summary and keywords caches for that note are deleted. Embeddings cache is not invalidated in the described flow but uses the same TTL.

### 3.6 Rate Limiting (AI Quota)

- **Prefix**: `usage:ai:`.
- **Key**: `usage:ai:{user_id}:{YYYY-MM}`. Value: integer count. TTL: seconds until end of that month.
- **Logic** (`core/rate_limit.py`): `check_and_increment_ai_usage(redis, user_id, plan)` increments the key; if new value > plan limit, raises `RateLimitExceeded`. Limits: `rate_limit_ai_free`, `rate_limit_ai_pro`, `rate_limit_ai_team` (defaults 50, 500, 2000). Used by summary, keywords, embeddings, and AI generate endpoints; on 429, usage_log records `ai_action_blocked`.
- **Quota API**: `get_quota_metadata` returns plan, limit, used, remaining, reset_period_end (ISO); frontend calls `GET /api/v1/usage/quota`.

### 3.7 Global Rate Limit Middleware

- **Middleware**: `RateLimitMiddleware` in `middlewares/rate_limit.py`.
- **Key**: `rl:ip:{client_host}:{YYYY-MM-DD-HH-MM}`. Increment per request; on first key set TTL 60s. If count > `requests_per_minute` (default 300), respond 429.

### 3.8 Pub/Sub (`integrations/redis/pubsub.py`)

- **publish(redis, channel, message)**: Publish string or JSON-encoded dict.
- **subscribe(redis, *channels)**: Async generator yielding `(channel, message)`. Used for real-time or worker signaling (e.g. translation). No in-request subscription in the described routes.

---

## 4. Backend (FastAPI)

### 4.1 Stack and Entrypoint

- **Framework**: FastAPI. App in `backend/app/main.py`.
- **Server**: Uvicorn; in Docker: `uvicorn app.main:app --host 0.0.0.0 --port 8000` (with `--reload` in dev).
- **Python**: 3.11+. Dependencies in `backend/pyproject.toml`: FastAPI, uvicorn, SQLAlchemy, asyncpg, redis, pydantic, pydantic-settings, alembic, pyjwt, passlib[bcrypt], openai, stripe, httpx, etc.

### 4.2 Configuration (`core/config.py`)

- **Source**: Pydantic Settings; env file `.env`, extra ignored.
- **Notable settings**: `app_env`, `debug`, `secret_key`; JWT (`jwt_algorithm`, `access_token_expires_minutes`, `refresh_token_expires_days`, `refresh_cookie_name`, `refresh_cookie_secure`); `database_url`, `redis_url`; OpenRouter (`openrouter_api_key`, `openrouter_chat_model`, `openrouter_embed_model`); `ai_cache_ttl_seconds`; rate limit numbers per plan; Stripe and Telegram webhook secrets; optional `tenant_header`, `tenant_strategy`.

### 4.3 Lifespan and Middleware

- **Lifespan**: Creates Redis client, assigns to `app.state.redis`, yields, then closes Redis.
- **CORS**: Allow origin `http://localhost:3000`, credentials true, all methods/headers.
- **RateLimitMiddleware**: 300 req/min per IP (see Redis section).
- **Request ID / Tenant**: Placeholder middlewares in `request_id.py` and `tenant_context.py` (no logic in the provided snippets).

### 4.4 Routing

- **Mount**: All API under `/api`; `api_router` in `app/api/router.py` includes v1 router at `/api/v1`.
- **V1 routes** (`api/v1/routes/`): auth, notes, tags, ai, usage, webhooks (see below).

### 4.5 Dependencies (`api/deps/__init__.py`)

- **get_redis(request)**: Returns `request.app.state.redis`.
- **get_current_user**: Requires `Authorization: Bearer <access_token>`. Decodes JWT via `decode_access_token`; loads user by `sub` (user id); 401 if invalid or user not found.
- **require_roles(roles)**: Depends on `get_current_user`; 403 if `user.role` not in list (e.g. `/auth/admin-only` uses `["owner", "admin"]`).
- **get_note_or_404** / **get_note_with_tags_or_404**: Resolve note by id for current user; 404 if not found (latter with tags loaded).
- **require_ai_rate_limit**: Calls `check_and_increment_ai_usage`; 429 if over limit (alternative to manual check in route).

### 4.6 Auth Routes (`/api/v1/auth`)

- **POST /register**: Body: email, password (min 8), display_name. Creates user (email unique), returns access token in JSON; refresh token in httpOnly cookie (if Redis available). 409 on duplicate email.
- **POST /login**: Body: email, password. Returns access + refresh (cookie). 401 on invalid credentials.
- **POST /refresh**: Reads refresh from cookie or body; validates, consumes JTI in Redis, rotates refresh; returns new access (and sets new refresh cookie). 401 if invalid.
- **POST /logout**: Clears refresh cookie (client should clear access and redirect).
- **GET /me**: Returns current user (id, email, role, display_name, avatar_url). Requires Bearer.
- **GET /admin-only**: Example RBAC; requires owner or admin.

### 4.7 Notes Routes (`/api/v1/notes`)

- **POST /** : Create note (title, content, source, is_archived). Returns note with tags. 201.
- **GET /counts**: Sidebar counts: all, archived, pinned, favorite, deleted.
- **GET /** : List notes; query params: limit, offset, archived, deleted, favorite, pinned, q (search), tag_id. Returns list of notes with tags.
- **POST /reorder**: Body: note_ids (ordered). Updates sort_order.
- **GET /{note_id}**: Single note with tags. 404 if not found.
- **PUT /{note_id}**: Update note (partial); invalidates summary/keywords cache if title/content changed.
- **DELETE /{note_id}**: Soft delete (is_deleted = true). 204.
- **POST /{note_id}/tags/{tag_id}**: Attach tag. Returns note with tags.
- **DELETE /{note_id}/tags/{tag_id}**: Detach tag. 204.
- **GET /{note_id}/summary**: Cached summary; on cache miss, rate-limited AI call, then cache and log usage.
- **GET /{note_id}/keywords**: Same pattern for keywords (cached, rate-limited).
- **POST /{note_id}/embeddings**: Cached embeddings; on miss, rate-limited OpenRouter embedding, then cache and log.

### 4.8 Tags Routes (`/api/v1/tags`)

- **GET /** : List tags for current user.
- **POST /** : Create tag (name unique per user). 201; 409 if name exists.

### 4.9 AI Routes (`/api/v1/ai`)

- **POST /generate**: Body: prompt_type (`brainstorm` | `draft_summary`), seed. Rate-limited; calls OpenRouter; logs usage. Returns generated content. 503 if OpenRouter not configured.

### 4.10 Usage Routes (`/api/v1/usage`)

- **GET /quota**: Returns quota metadata (plan, limit, used, remaining, reset_period_end) for current user (plan currently hardcoded "free" in route).

### 4.11 Webhooks (`/api/v1/webhooks`)

- **POST /stripe**: Verifies Stripe signature with `stripe.Webhook.construct_event`; 200 ack. No org/subscription update in single-user app.
- **POST /telegram**: Verifies `X-Telegram-Bot-Api-Secret-Token` if configured; 200. Body accepted but not processed in the snippet (worker could consume).

### 4.12 Security (`core/security.py`)

- **Password**: bcrypt; hash truncated to 72 bytes before hashing; `hash_password`, `verify_password`.
- **JWT**: HS256, secret from config. Access: sub (user id), exp, iat. Refresh: sub, jti, type=`"refresh"`, exp, iat. `create_access_token`, `decode_access_token`, `create_refresh_token`, `decode_refresh_token`.

### 4.13 Services

- **AuthService** (`services/auth.py`): Register, login, refresh_tokens; uses UserRepository and Redis for JTI store/consume.
- **AI** (`services/ai.py`): OpenRouter client (base URL OpenRouter); `summarize_text`, `extract_keywords`, `generate_for_prompt` (brainstorm/draft_summary); cache get/set/delete for summary and keywords.
- **Embeddings** (`services/embeddings.py`): HTTP POST to OpenRouter embeddings API; cache key `embedding:{note_id}`; returns (vector, dimension).

### 4.14 Schemas (Pydantic)

- **Auth**: RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, CurrentUserResponse.
- **Note**: NoteCreateInput, NoteUpdateInput, TagRefResponse, NoteResponse, NoteCountsResponse, NotesReorderInput, SummaryResponse, KeywordsResponse, EmbeddingsResponse.
- **Tag**: TagCreateInput, TagResponse.
- **AI**: AIGenerateInput, AIGenerateResponse.
- **Usage**: QuotaResponse.

### 4.15 Health

- **GET /health**: 200 `{"status": "ok"}` (liveness).
- **GET /ready**: Checks DB (async engine, SELECT 1) and Redis ping; 503 with `checks: { database | redis: "fail" }` if either fails (readiness).

---

## 5. Frontend (Next.js)

### 5.1 Stack

- **Next.js** 16, App Router. React 18.
- **State**: Zustand with persist (auth: accessToken, user, isAuthenticated; partialize excludes refresh token from storage).
- **HTTP**: Axios instance in `src/lib/api.ts`; baseURL from `NEXT_PUBLIC_API_URL`, withCredentials true. Interceptors: add Bearer from store; on 401 (except login/refresh) try refresh via cookie or body, then retry request; on refresh failure, logout.
- **Forms**: react-hook-form, zod, @hookform/resolvers.
- **UI**: Tailwind, Radix Slot, CVA, clsx, tailwind-merge; Framer Motion; Lucide icons.

### 5.2 Auth Store (`store/auth.ts`)

- **State**: accessToken, refreshToken, user, isAuthenticated, hasHydrated.
- **Actions**: setTokens, setUser, setHasHydrated, logout.
- **Persistence**: key `auth-storage`; partialize: accessToken, user, isAuthenticated. onRehydrateStorage sets hasHydrated when rehydration finishes (with optional DEBUG_AUTH logging).

### 5.3 API Client (`lib/api.ts`)

- **Instance**: axios create with baseURL, JSON headers, withCredentials.
- **Request interceptor**: Adds `Authorization: Bearer <accessToken>` from store.
- **Response interceptor**: On 401 and not auth endpoint, retry once: POST `/api/v1/auth/refresh` with credentials (and optional body refresh_token), then set new tokens and retry original request; on failure, logout.
- **Types**: e.g. QuotaResponse for usage/quota.

### 5.4 Routing and Layouts

- **Root**: `app/layout.tsx` wraps the app.
- **Landing**: `app/page.tsx` (marketing/landing).
- **Auth group** `(auth)`: signin `app/(auth)/signin/page.tsx`, login, register (signin is the main sign-in page with zod + react-hook-form; login/register may be aliases or alternate flows).
- **Dashboard**: `app/dashboard/layout.tsx` and pages under `app/dashboard/`.

### 5.5 Dashboard Layout (`dashboard/layout.tsx`)

- **Client**: Uses auth store. Waits for hasHydrated (with 2.5s fallback). If not authenticated, attempts silent refresh (POST refresh with cookie); on success fetches `/auth/me` and sets user; on failure redirects to `/signin`. If after resolution still unauthenticated, redirect to signin.
- **UI**: When authenticated: Sidebar + conditional NotesList (when a note is selected, i.e. `params.id` present) + main content area (children). Main area has different width/background when a note is open (max-w-5xl card style). Full-height flex layout.

### 5.6 Dashboard Pages

- **Dashboard home** (`dashboard/page.tsx`): Renders note grid or empty state. Uses search params `filter` (all | favorites | archived | deleted) and `tag_id`. Fetches notes from `GET /api/v1/notes` with corresponding query params; debounced search (local state + `q` to API). Create note: POST note, then navigate to `/dashboard/notes/{id}` and dispatch `dashboard:refresh-notes`. Drag-and-drop reorder (when filter all, no tag, no search): reorder state then POST `/api/v1/notes/reorder`. Note cards show date, pin/favorite, title, content preview, tag-based color (from `lib/tag-colors.ts`). Framer Motion for list animation and hover.
- **Note editor** (`dashboard/notes/[id]/page.tsx`): Loads note, tags, quota. Form (title, content) with react-hook-form; pin/favorite toggles; tag attach/detach dropdown; AI section: summary, keywords, embeddings (each collapsible); Wikipedia preview for selected keyword (WikipediaPreviewPanel). Save updates note; delete soft-deletes and navigates to dashboard. Fetches `/notes/{id}`, `/tags`, `/usage/quota`; summary/keywords/embeddings endpoints with loading and cache display. Tag colors from `getTagPillClass` / `getTagPillStyle` (tag-colors).

### 5.7 Dashboard Components

- **Sidebar** (`dashboard/components/Sidebar.tsx`): Collapsible; links: All Notes, Favorites, Archived, Recently Deleted (with counts from GET /notes/counts); Tags section with list and “Add tag” (name + color picker: palette + recent + custom hex stored in localStorage via `lib/tag-colors.ts`). Create tag: POST /tags, then setTagColor and refresh. Logout: POST /auth/logout, logout from store, redirect to signin.
- **NotesList** (`dashboard/components/NotesList.tsx`): Shown when a note is selected. Fetches notes (filter/tag_id from search params); local search filter; list of note cards with link to `/dashboard/notes/{id}`; “New note” button; listens for `dashboard:refresh-notes`.

### 5.8 Shared Components and Libs

- **UI**: Button, Input, Card, Spinner (under `components/ui/`).
- **KeywordRichEditor**: Rich editor for note content with keyword highlighting.
- **WikipediaPreviewPanel**: Fetches/displays Wikipedia snippet for a chosen keyword.
- **tag-colors** (`lib/tag-colors.ts`): Tag-to-color mapping: palette index or custom hex; stored per tag in localStorage (`tag_color_index`); recent and custom color lists; helpers for pill/card styles and dot styles used in Sidebar and note cards.

### 5.9 Environment

- **NEXT_PUBLIC_API_URL**: Backend base URL (e.g. http://localhost:8000).
- **NEXT_PUBLIC_DEBUG_AUTH**: Optional; enables auth debug logs (store rehydration, dashboard refresh, signin).

---

## 6. Docker and Deployment

### 6.1 Development (`docker-compose.yml`)

- **Services**: api, frontend, postgres, redis.
- **api**: Build from backend, port 8000; env DATABASE_URL (postgres host), REDIS_URL (redis host); volume mount backend app for reload; command: alembic upgrade head + uvicorn with reload; depends on postgres and redis healthy; healthcheck GET /ready; memory limits.
- **frontend**: Build from frontend Dockerfile.dev, port 3000; NEXT_PUBLIC_API_URL=http://localhost:8000, WATCHPACK_POLLING; volume mount frontend, named volume for node_modules; depends on api.
- **postgres**: 16-alpine, env from env or defaults; volume postgres_data; port 5432; healthcheck pg_isready.
- **redis**: 7-alpine, appendonly yes; volume redis_data; port 6379; healthcheck redis-cli ping.
- **Network**: default name `backend`. Volumes: postgres_data, redis_data, frontend_node_modules.

### 6.2 Production Overrides (`docker-compose.prod.yml`)

- **api**: No host volumes; no reload; ports not exposed (reverse proxy); higher memory.
- **frontend**: Built with production Dockerfile; no dev volumes; ports not exposed; NEXT_PUBLIC_API_URL from env.
- **postgres / redis**: Ports not exposed; higher memory limits.

---

## 7. External Integrations

- **OpenRouter**: Chat (summarize, keywords, brainstorm/draft_summary) and embeddings. API key and model names in backend config only. Used by AI and embeddings services; 503 when not configured.
- **Stripe**: Webhook endpoint for signature verification; no subscription persistence in single-user app.
- **Telegram**: Webhook endpoint with optional secret token verification; no handler logic in the snippet.

---

## 8. Testing (Backend)

- **pytest** with pytest-asyncio; test paths under `tests/`. Markers: integration (DB, Redis).
- **conftest**: Fixtures for tests.
- **integration**: test_auth, test_notes, test_usage.
- **unit**: test_note_repository, test_note_service, test_security.

---

## 9. Summary Table

| Layer        | Technology / Detail |
|-------------|----------------------|
| DB          | PostgreSQL 16, asyncpg, SQLAlchemy 2 async, Alembic |
| Redis       | redis 5+ async; cache, refresh JTI, AI cache, usage:ai counters, rl:ip middleware |
| Backend     | FastAPI, Uvicorn, JWT (access + refresh rotation), bcrypt |
| Auth        | Bearer access token; httpOnly refresh cookie; refresh rotation with Redis JTI |
| AI          | OpenRouter (chat + embeddings); Redis cache; per-user monthly quota (Redis) |
| Frontend    | Next.js 16 App Router, Zustand persist, Axios + 401 refresh retry |
| Deployment  | Docker Compose; dev with reload and host ports; prod without host ports |

This covers the database, Redis, backend API, frontend app, Docker, and external integrations in one place. For a specific file or flow, the paths and section numbers above can be used to locate it quickly.
