#!/bin/bash

# Database backup script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ENVIRONMENT=${1:-production}

echo -e "${GREEN}💾 Starting database backup...${NC}"

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ Environment file .env.$ENVIRONMENT not found${NC}"
    exit 1
fi

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
DB_BACKUP_FILE="$BACKUP_DIR/database_backup_$TIMESTAMP.sql"
echo -e "${YELLOW}📊 Backing up PostgreSQL database...${NC}"

if docker-compose ps postgres | grep -q "Up"; then
    docker-compose exec -T postgres pg_dump -U $DB_USER -d $DB_NAME > $DB_BACKUP_FILE
    echo -e "${GREEN}✅ Database backup saved to: $DB_BACKUP_FILE${NC}"
else
    echo -e "${RED}❌ PostgreSQL container is not running${NC}"
    exit 1
fi

# Compress backup
echo -e "${YELLOW}🗜️ Compressing backup...${NC}"
gzip $DB_BACKUP_FILE
DB_BACKUP_FILE="$DB_BACKUP_FILE.gz"

# Upload to S3 if configured
if [ ! -z "$BACKUP_S3_BUCKET" ] && [ ! -z "$AWS_ACCESS_KEY_ID" ]; then
    echo -e "${YELLOW}☁️ Uploading backup to S3...${NC}"
    aws s3 cp $DB_BACKUP_FILE s3://$BACKUP_S3_BUCKET/database/$(basename $DB_BACKUP_FILE)
    echo -e "${GREEN}✅ Backup uploaded to S3${NC}"
fi

# Backup uploaded files
UPLOADS_BACKUP_FILE="$BACKUP_DIR/uploads_backup_$TIMESTAMP.tar.gz"
if [ -d "./backend/uploads" ]; then
    echo -e "${YELLOW}📁 Backing up uploaded files...${NC}"
    tar -czf $UPLOADS_BACKUP_FILE -C ./backend uploads/
    echo -e "${GREEN}✅ Uploads backup saved to: $UPLOADS_BACKUP_FILE${NC}"
    
    # Upload uploads backup to S3
    if [ ! -z "$BACKUP_S3_BUCKET" ] && [ ! -z "$AWS_ACCESS_KEY_ID" ]; then
        aws s3 cp $UPLOADS_BACKUP_FILE s3://$BACKUP_S3_BUCKET/uploads/$(basename $UPLOADS_BACKUP_FILE)
        echo -e "${GREEN}✅ Uploads backup uploaded to S3${NC}"
    fi
fi

# Clean up old backups (keep last 30 days)
echo -e "${YELLOW}🧹 Cleaning up old backups...${NC}"
find $BACKUP_DIR -name "*.gz" -type f -mtime +${BACKUP_RETENTION_DAYS:-30} -delete
echo -e "${GREEN}✅ Old backups cleaned up${NC}"

# Show backup info
BACKUP_SIZE=$(du -h $DB_BACKUP_FILE | cut -f1)
echo -e "${GREEN}📊 Backup completed successfully!${NC}"
echo -e "${GREEN}   Database backup: $DB_BACKUP_FILE ($BACKUP_SIZE)${NC}"
if [ -f "$UPLOADS_BACKUP_FILE" ]; then
    UPLOADS_SIZE=$(du -h $UPLOADS_BACKUP_FILE | cut -f1)
    echo -e "${GREEN}   Uploads backup: $UPLOADS_BACKUP_FILE ($UPLOADS_SIZE)${NC}"
fi

echo -e "${GREEN}✅ Backup process completed!${NC}"