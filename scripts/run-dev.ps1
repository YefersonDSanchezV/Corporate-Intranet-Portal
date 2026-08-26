$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
Write-Host "[dev] Levantando stack integrado (backend .env_pruebas + frontend)..."
docker compose -f docker-compose.dev.yml up --build -d
Write-Host "[dev] Esperando healthcheck backend..."
for ($i=0; $i -lt 30; $i++) {
  $status = docker inspect --format='{{.State.Health.Status}}' intranet-backend-dev 2>$null
  if ($status -eq "healthy") { Write-Host "[dev] Backend healthy"; break }
  Start-Sleep -Seconds 2
}
Write-Host "[dev] Frontend: http://localhost:3000  |  Backend: http://localhost:8080  |  Swagger: http://localhost:8080/swagger-ui.html"
docker compose -f docker-compose.dev.yml ps
