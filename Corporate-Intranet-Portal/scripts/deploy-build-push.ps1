# ============================================
# Script: deploy-build-push.ps1
# Purpose: Build Docker image and push to registry (Windows)
# Usage:   .\scripts\deploy-build-push.ps1 [[tag]]
# ============================================

param(
    [string]$Tag = "latest"
)

$DOCKER_REGISTRY = $env:DOCKER_REGISTRY
if (-not $DOCKER_REGISTRY) { $DOCKER_REGISTRY = "asisingenieria" }

$IMAGE_NAME = "${DOCKER_REGISTRY}/corporate-intranet-portal"

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  Intranet Portal - Build & Push" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Registry: $DOCKER_REGISTRY" -ForegroundColor Green
Write-Host "Image:    ${IMAGE_NAME}:${Tag}" -ForegroundColor Green
Write-Host ""

# Step 1: Build the Docker image
Write-Host "[1/3] Building Docker image..." -ForegroundColor Yellow
docker build `
    --platform linux/amd64 `
    -t "${IMAGE_NAME}:${Tag}" `
    -t "${IMAGE_NAME}:latest" `
    -f Dockerfile `
    .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "Build complete" -ForegroundColor Green
Write-Host ""

# Step 2: Push to Docker Hub
Write-Host "[2/3] Pushing image to Docker Hub..." -ForegroundColor Yellow
docker push "${IMAGE_NAME}:${Tag}"
docker push "${IMAGE_NAME}:latest"
Write-Host "Push complete" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "[3/3] Complete!" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Image pushed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Image: ${IMAGE_NAME}:${Tag}"
Write-Host ""
Write-Host "To deploy on server:"
Write-Host "  1. Copy docker-compose.prod.yml to the server"
Write-Host "  2. Run: docker compose -f docker-compose.prod.yml pull"
Write-Host "  3. Run: docker compose -f docker-compose.prod.yml up -d"