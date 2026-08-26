$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
Write-Host "[prod] Levantando stack integrado (backend .env + frontend)..."
docker compose -f docker-compose.prod.yml up --build -d
Write-Host "[prod] Esperando healthcheck backend..."
for ($i=0; $i -lt 30; $i++) {
  $status = docker inspect --format='{{.State.Health.Status}}' intranet-backend 2>$null
  if ($status -eq "healthy") { Write-Host "[prod] Backend healthy"; break }
  Start-Sleep -Seconds 2
}
Write-Host "[prod] Frontend: http://localhost  |  Backend: http://localhost:8080  |  Swagger: http://localhost:8080/swagger-ui.html"
docker compose -f docker-compose.prod.yml ps
