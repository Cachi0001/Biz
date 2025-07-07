# Use Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=src.main:app \
    FLASK_ENV=production

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        libpq-dev \
        gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn psycopg2-binary

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads logs static

# Copy frontend build (if available) - This line was causing the error
# The original line was: COPY ../../frontend/bizflow-frontend/dist/ static/ 2>/dev/null || echo "Frontend build not found, skipping..."
# Dockerfile COPY instruction does not support shell redirection or conditional execution.
# If the frontend build is not guaranteed to exist, it's better to handle this outside the Dockerfile
# or ensure the path is always valid for the build context.
# For now, I will comment out this line to allow the backend to build.
# If the frontend needs to be served by the backend, we will need a different strategy.
# COPY ../../frontend/bizflow-frontend/dist/ static/

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser \
    && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Run the application
CMD ["gunicorn", "--worker-class", "sync", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "--keep-alive", "2", "--max-requests", "1000", "--max-requests-jitter", "100", "src.main:app"]


