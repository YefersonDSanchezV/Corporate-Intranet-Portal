#!/bin/bash
# ============================================
# Script: deploy-build-push.sh
# Purpose: Build Docker image and push to registry
# Usage:   ./scripts/deploy-build-push.sh [tag]
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REGISTRY="${DOCKER_REGISTRY:-asisingenieria}"
IMAGE_NAME="${DOCKER_REGISTRY}/corporate-intranet-portal"
TAG="${1:-latest}"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Intranet Portal - Build & Push${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "Registry: ${GREEN}${DOCKER_REGISTRY}${NC}"
echo -e "Image:    ${GREEN}${IMAGE_NAME}:${TAG}${NC}"
echo ""

# Step 1: Login to Docker Hub (if not already logged in)
echo -e "${YELLOW}[1/4] Checking Docker Hub login...${NC}"
if ! docker info 2>/dev/null | grep -q "Username"; then
    echo "Please login to Docker Hub:"
    docker login
fi
echo -e "${GREEN}✓ Login check complete${NC}"
echo ""

# Step 2: Build the Docker image
echo -e "${YELLOW}[2/4] Building Docker image...${NC}"
docker build \
    --platform linux/amd64 \
    -t ${IMAGE_NAME}:${TAG} \
    -t ${IMAGE_NAME}:latest \
    -f Dockerfile \
    .
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Step 3: Push to Docker Hub
echo -e "${YELLOW}[3/4] Pushing image to Docker Hub...${NC}"
docker push ${IMAGE_NAME}:${TAG}
docker push ${IMAGE_NAME}:latest
echo -e "${GREEN}✓ Push complete${NC}"
echo ""

# Step 4: Cleanup local images (optional)
echo -e "${YELLOW}[4/4] Build summary${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Image pushed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Image: ${IMAGE_NAME}:${TAG}"
echo ""
echo "To deploy on the server:"
echo "  1. Copy docker-compose.prod.yml to the server"
echo "  2. Run: docker compose -f docker-compose.prod.yml pull"
echo "  3. Run: docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "Or use the deploy-pull-run.sh script on the server."