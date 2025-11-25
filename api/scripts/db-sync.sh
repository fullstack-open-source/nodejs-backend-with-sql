#!/bin/bash

# Database Schema Sync Script
# Pulls schema from remote database and pushes to local database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Database Schema Sync${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

# Load .env file
export $(cat .env | grep -v '^#' | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL not set in .env file!${NC}"
    exit 1
fi

echo -e "${YELLOW}Current DATABASE_URL:${NC}"
echo "$DATABASE_URL" | sed 's/:[^:]*@/:***@/g'  # Hide password
echo ""

# Ask for confirmation
read -p "Do you want to pull schema from this database? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}📥 Pulling schema from remote database...${NC}"
npx prisma db pull

echo ""
echo -e "${GREEN}🔨 Generating Prisma Client...${NC}"
npx prisma generate

echo ""
echo -e "${GREEN}✅ Schema pulled successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the schema in prisma/schema.prisma"
echo "2. Update DATABASE_URL in .env to point to your local database"
echo "3. Run: npm run db:push"
echo ""

