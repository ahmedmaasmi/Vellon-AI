# Worker service Dockerfile
# Background tasks / scheduler
FROM python:3.12-slim

WORKDIR /app
COPY pyproject.toml ./
RUN pip install --no-cache-dir .
COPY . .
# CMD depends on worker implementation (e.g. celery -A app.workers worker)
CMD ["echo", "Configure worker entrypoint"]
