# Worker service Dockerfile
# Background tasks / scheduler
FROM python:3.12-slim

WORKDIR /app
COPY pyproject.toml ./
RUN pip install --no-cache-dir .
COPY . .
# ARQ worker: processes tasks from Redis queue
CMD ["arq", "app.workers.settings.WorkerSettings"]
