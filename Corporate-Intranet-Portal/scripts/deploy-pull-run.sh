#!/bin/bash
# ============================================
# Script: deploy-pull-run.sh
# Purpose: Run on the SERVER to pull and deploy
# Usage:   ./scripts/deploy-pull-run.sh [tag]
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
IMAGE_NAME="${DOCKER_REGISTRY:-asisingenieria}/corporate-intranet-portal"
TAG="${1:-latest}"
COMPOSE_FILE="docker-compose.prod.yml"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Intranet Portal - Server Deploy${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "Image: ${GREEN}${IMAGE_NAME}:${TAG}${NC}"
echo ""

# Step 1: Ensure docker-compose.prod.yml exists
if [ ! -f "${COMPOSE_FILE}" ]; then
    echo -e "${RED}Error: ${COMPOSE_FILE} not found in current directory${NC}"
    echo "Please copy docker-compose.prod.yml to this server first."
    exit 1
fi

# Step 2: Login to Docker Hub (if needed)
echo -e "${YELLOW}[1/3] Checking Docker Hub login...${NC}"
if ! docker info 2>/dev/null | grep -q "Username"; then
    echo "Please login to Docker Hub:"
    docker login
fi
echo -e "${GREEN}✓ Login check complete${NC}"
echo ""

# Step 3: Pull the latest image
echo -e "${YELLOW}[2/3] Pulling image ${IMAGE_NAME}:${TAG}...${NC}"
export TAG="${TAG}"
docker compose -f ${COMPOSE_FILE} pull
echo -e "${GREEN}✓ Pull complete${NC}"
echo ""

# Step 4: Deploy the container
echo -e "${YELLOW}[3/3] Deploying container...${NC}"
docker compose -f ${COMPOSE_FILE} up -d
echo -e "${GREEN}✓ Container deployed${NC}"
echo ""

# Verify deployment
echo -e "${YELLOW}Verifying deployment...${NC}"
sleep 3
if docker ps --filter "name=intranet-portal-prod" --format "{{.Status}}" | grep -q "Up"; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Deployment successful!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Container status:"
    docker ps --filter "name=intranet-portal-prod"
    echo ""
    echo "The portal should now be accessible at http://$(curl -s ifconfig.me 2>/dev/null || echo 'your-server-ip')"
else
    echo -e "${RED}Deployment may have failed. Check logs:${NC}"
    docker logs intranet-portal-prod --tail 20
fi