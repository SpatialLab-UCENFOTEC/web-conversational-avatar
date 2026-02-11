# ---- Build frontend ----
FROM node:20-alpine AS frontend-builder
WORKDIR /app

COPY avatar-demo/package*.json ./avatar-demo/
RUN npm ci --prefix ./avatar-demo
COPY avatar-demo ./avatar-demo
RUN npm run build --prefix ./avatar-demo

# ---- Runtime ----
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY llm-server/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY llm-server/ /app/
COPY --from=frontend-builder /app/avatar-demo/dist /app/static

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]