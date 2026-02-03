# Use lightweight Python base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (needed for docker SDK + curl for healthcheck)
RUN apt-get update && apt-get install -y \
    curl \
    docker.io \
    gcc \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency list first (for caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create directories for output/temp
RUN mkdir -p output temp

# Environment variables
ENV PYTHONPATH=/app \
    PORT=8000 \
    FLASK_ENV=production

# Expose port
EXPOSE 8000

# Add healthcheck (must match app.py /health endpoint)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Use a non-root user (security best practice)
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Start app with Gunicorn (better than "python app.py" in production)
# Gunicorn binds to 0.0.0.0:$PORT, Flask app is in app:app
CMD ["python", "app.py"]