# Use slim Python image
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Working directory inside the container
WORKDIR /app

# Copy backend service code
COPY service /app/service

# Install dependencies
COPY service/requirements.txt /app/
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy artifacts (optional; include if they exist locally)
COPY artifacts /app/artifacts

# Set environment for artifact dir
ENV ARTIFACT_DIR=/app/artifacts

# Expose API port
EXPOSE 8000

# Start FastAPI with Uvicorn
CMD ["uvicorn", "service.main:app", "--host", "0.0.0.0", "--port", "8000"]
