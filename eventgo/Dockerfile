FROM python:3.13-slim

WORKDIR /app

# Install system dependencies for MySQL driver
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc default-libmysqlclient-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY eventgo/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY eventgo/ .

# Expose port
EXPOSE 8000

# Run the application
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
