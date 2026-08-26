#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"
echo "[dev] Levantando stack integrado (backend .env_pruebas + frontend)..."
docker compose -f docker-compose.dev.yml up --build -d
echo "[dev] Esperando healthcheck backend..."
for i in {1..30}; do
  if docker inspect --format='{{.State.Health.Status}}' intranet-backend-dev 2>/dev/null | grep -q healthy; then
    echo "[dev] Backend healthy"
    break
  fi
  sleep 2
done
echo "[dev] Frontend: http://localhost:3000  |  Backend: http://localhost:8080  |  Swagger: http://localhost:8080/swagger-ui.html"
docker compose -f docker-compose.dev.yml ps
