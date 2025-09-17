#!/bin/bash

# Deployment script for Clínica Dental System
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_BEFORE_DEPLOY=${2:-true}
RUN_MIGRATIONS=${3:-true}

echo -e "${GREEN}🚀 Starting deployment for environment: $ENVIRONMENT${NC}"

# Check if required files exist
if [ ! -f ".env.$ENVIRONMENT" ]; then
    echo -e "${RED}❌ Environment file .env.$ENVIRONMENT not found${NC}"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml not found${NC}"
    exit 1
fi

# Load environment variables
export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)

# Create necessary directories
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p logs
mkdir -p uploads
mkdir -p backups
mkdir -p nginx/ssl
mkdir -p nginx/logs

# Backup database if requested
if [ "$BACKUP_BEFORE_DEPLOY" = "true" ]; then
    echo -e "${YELLOW}💾 Creating database backup...${NC}"
    ./scripts/backup.sh
fi

# Pull latest images
echo -e "${YELLOW}📥 Pulling latest Docker images...${NC}"
docker-compose pull

# Build images
echo -e "${YELLOW}🔨 Building Docker images...${NC}"
docker-compose build --no-cache

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose down

# Start new containers
echo -e "${YELLOW}🚀 Starting new containers...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
    docker-compose --profile production up -d
else
    docker-compose up -d
fi

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 30

# Check service health
echo -e "${YELLOW}🏥 Checking service health...${NC}"
for service in postgres redis backend frontend; do
    if docker-compose ps $service | grep -q "healthy\|Up"; then
        echo -e "${GREEN}✅ $service is healthy${NC}"
    else
        echo -e "${RED}❌ $service is not healthy${NC}"
        docker-compose logs $service
        exit 1
    fi
done

# Run database migrations if requested
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo -e "${YELLOW}🗄️ Running database migrations...${NC}"
    docker-compose exec backend npm run migrate:deploy
fi

# Run database seeding for development
if [ "$ENVIRONMENT" = "development" ]; then
    echo -e "${YELLOW}🌱 Seeding database...${NC}"
    docker-compose exec backend npm run seed
fi

# Clean up old images
echo -e "${YELLOW}🧹 Cleaning up old Docker images...${NC}"
docker image prune -f

# Show deployment status
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Application is running at:${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${GREEN}   Frontend: https://your-domain.com${NC}"
    echo -e "${GREEN}   Backend API: https://your-domain.com/api${NC}"
else
    echo -e "${GREEN}   Frontend: http://localhost:5173${NC}"
    echo -e "${GREEN}   Backend API: http://localhost:3001/api${NC}"
    echo -e "${GREEN}   Adminer: http://localhost:8080${NC}"
    echo -e "${GREEN}   Mailhog: http://localhost:8025${NC}"
fi

# Show container status
echo -e "${YELLOW}📊 Container status:${NC}"
docker-compose ps

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"