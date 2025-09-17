#!/bin/bash

# Health check script for all services
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
ALERT_EMAIL=${2:-admin@your-domain.com}

echo -e "${GREEN}🏥 Starting health check for environment: $ENVIRONMENT${NC}"

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
fi

# Function to check service health
check_service_health() {
    local service_name=$1
    local health_url=$2
    local expected_status=${3:-200}
    
    echo -e "${YELLOW}🔍 Checking $service_name...${NC}"
    
    if curl -f -s -o /dev/null -w "%{http_code}" "$health_url" | grep -q "$expected_status"; then
        echo -e "${GREEN}✅ $service_name is healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is unhealthy${NC}"
        return 1
    fi
}

# Function to check database connection
check_database() {
    echo -e "${YELLOW}🔍 Checking database connection...${NC}"
    
    if docker-compose exec -T postgres pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database is healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ Database is unhealthy${NC}"
        return 1
    fi
}

# Function to check Redis connection
check_redis() {
    echo -e "${YELLOW}🔍 Checking Redis connection...${NC}"
    
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis is healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ Redis is unhealthy${NC}"
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    echo -e "${YELLOW}🔍 Checking disk space...${NC}"
    
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$DISK_USAGE" -lt 80 ]; then
        echo -e "${GREEN}✅ Disk space is healthy ($DISK_USAGE% used)${NC}"
        return 0
    elif [ "$DISK_USAGE" -lt 90 ]; then
        echo -e "${YELLOW}⚠️ Disk space is getting low ($DISK_USAGE% used)${NC}"
        return 1
    else
        echo -e "${RED}❌ Disk space is critically low ($DISK_USAGE% used)${NC}"
        return 1
    fi
}

# Function to check memory usage
check_memory() {
    echo -e "${YELLOW}🔍 Checking memory usage...${NC}"
    
    MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ "$MEMORY_USAGE" -lt 80 ]; then
        echo -e "${GREEN}✅ Memory usage is healthy ($MEMORY_USAGE% used)${NC}"
        return 0
    elif [ "$MEMORY_USAGE" -lt 90 ]; then
        echo -e "${YELLOW}⚠️ Memory usage is high ($MEMORY_USAGE% used)${NC}"
        return 1
    else
        echo -e "${RED}❌ Memory usage is critically high ($MEMORY_USAGE% used)${NC}"
        return 1
    fi
}

# Function to send alert
send_alert() {
    local message=$1
    local subject="Health Check Alert - Clínica Dental System"
    
    if [ ! -z "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "$subject" "$ALERT_EMAIL"
        echo -e "${YELLOW}📧 Alert sent to $ALERT_EMAIL${NC}"
    fi
    
    # Log to file
    echo "$(date): $message" >> ./logs/health-check.log
}

# Initialize counters
TOTAL_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Run health checks
HEALTH_CHECKS=(
    "check_database"
    "check_redis"
    "check_disk_space"
    "check_memory"
)

# Service URLs for health checks
if [ "$ENVIRONMENT" = "production" ]; then
    FRONTEND_URL="https://your-domain.com/health"
    BACKEND_URL="https://your-domain.com/api/health"
else
    FRONTEND_URL="http://localhost:80/health"
    BACKEND_URL="http://localhost:3001/api/health"
fi

# Check services
for check in "${HEALTH_CHECKS[@]}"; do
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if ! $check; then
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
done

# Check web services
TOTAL_CHECKS=$((TOTAL_CHECKS + 2))

if ! check_service_health "Frontend" "$FRONTEND_URL"; then
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

if ! check_service_health "Backend API" "$BACKEND_URL"; then
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Check Docker containers
echo -e "${YELLOW}🔍 Checking Docker containers...${NC}"
UNHEALTHY_CONTAINERS=$(docker-compose ps --filter "health=unhealthy" -q | wc -l)

if [ "$UNHEALTHY_CONTAINERS" -eq 0 ]; then
    echo -e "${GREEN}✅ All Docker containers are healthy${NC}"
else
    echo -e "${RED}❌ $UNHEALTHY_CONTAINERS Docker containers are unhealthy${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    docker-compose ps --filter "health=unhealthy"
fi

# Generate report
echo -e "${GREEN}📊 Health Check Summary:${NC}"
echo -e "${GREEN}   Total checks: $TOTAL_CHECKS${NC}"
echo -e "${GREEN}   Passed: $((TOTAL_CHECKS - FAILED_CHECKS))${NC}"
if [ "$FAILED_CHECKS" -gt 0 ]; then
    echo -e "${RED}   Failed: $FAILED_CHECKS${NC}"
fi

# Send alerts if there are failures
if [ "$FAILED_CHECKS" -gt 0 ]; then
    ALERT_MESSAGE="Health check failed for Clínica Dental System ($ENVIRONMENT)
    
Failed checks: $FAILED_CHECKS/$TOTAL_CHECKS
Time: $(date)
Environment: $ENVIRONMENT

Please check the system immediately."
    
    send_alert "$ALERT_MESSAGE"
    echo -e "${RED}❌ Health check completed with $FAILED_CHECKS failures${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All health checks passed!${NC}"
    exit 0
fi