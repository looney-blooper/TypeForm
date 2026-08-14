FROM python:3.12-slim

WORKDIR /app

# Install deps first for better layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# SQLite file lives in a volume so data survives container restarts (see docker-compose.yml)
RUN mkdir -p /app/data
ENV DATABASE_PATH=/app/data/app.db

EXPOSE 8000

# Run migrations, seed if empty, then start the API.
CMD ["sh", "-c", "alembic upgrade head && python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
