# Production API Dockerfile: multi-stage, non-root, minimal surface
# Stage 1: install package and dependencies (no [dev])
FROM python:3.12-slim-bookworm AS builder

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_NO_CACHE_DIR=1

COPY pyproject.toml ./
COPY app ./app
RUN pip install --no-cache-dir .

# Stage 2: runtime image
FROM python:3.12-slim-bookworm

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Non-root user (security best practice)
RUN groupadd --gid 1000 appuser && useradd --uid 1000 --gid appuser --shell /bin/bash --create-home appuser

# Copy installed packages from builder (no dev/test deps)
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Application code and config (runtime uses /app for PYTHONPATH; alembic needs these)
COPY app ./app
COPY pyproject.toml alembic.ini ./

RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
