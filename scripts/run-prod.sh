#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"
echo "[prod] Levantando stack integrado (backend .env + frontend)..."
docker compose -f docker-compose.prod.yml up --build -d
echo "[prod] Esperando healthcheck backend..."
for i in {1..30}; do
  if docker inspect --format='{{.State.Health.Status}}' intranet-backend 2>/dev/null | grep -q healthy; then
    echo "[prod] Backend healthy"
    break
  fi
  sleep 2
done
echo "[prod] Frontend: http://localhost  |  Backend: http://localhost:8080  |  Swagger: http://localhost:8080/swagger-ui.html"
docker compose -f docker-compose.prod.yml ps
