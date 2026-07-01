# Packages the Pre-Legal backend (FastAPI) into a container.
# The frontend prototype is static and can be served separately during development.
FROM python:3.12-slim

# uv for fast, reproducible dependency installs.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app
COPY templates/ ./templates/
COPY backend/ ./backend/

WORKDIR /app/backend
RUN uv sync

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
