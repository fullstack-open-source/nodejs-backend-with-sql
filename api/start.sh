#!/bin/sh

# ==============================================================================
# Node.js backend start script with PM2 and Prisma setup
# ==============================================================================
# Prisma DB push and seed run ONLY in development mode
# ==============================================================================

# Default API_MODE
API_MODE=${API_MODE:-development}

# Determine PM2 app name
if [ "$API_MODE" = "staging" ]; then
    APP_NAME="nodejs-backend-with-postgresql-staging"
elif [ "$API_MODE" = "development" ]; then
    APP_NAME="nodejs-backend-with-postgresql-dev"
elif [ "$API_MODE" = "production" ]; then
    APP_NAME="nodejs-backend-with-postgresql-prod"
else
    echo "Warning: Invalid API_MODE: $API_MODE, defaulting to development"
    APP_NAME="nodejs-backend-with-postgresql-dev"
fi

echo "=============================================="
echo "API_MODE: $API_MODE"
echo "PM2 App Name: $APP_NAME"
echo "=============================================="

# ------------------------------------------------------------------------------
# Load environment variables
# ------------------------------------------------------------------------------
if [ -f .env ]; then
    echo "Loading .env file"
    export $(grep -v '^#' .env | xargs)
fi

# ------------------------------------------------------------------------------
# Run Prisma DB push + seed ONLY in development
# ------------------------------------------------------------------------------
if [ "$API_MODE" = "development" ]; then
    echo "Running Prisma steps (dev only)..."

    echo "Running Prisma DB push..."
    npx prisma db push --accept-data-loss
    if [ $? -ne 0 ]; then
        echo "Error: Prisma db push failed!"
        exit 1
    fi

    if [ -f prisma/seed.js ]; then
        echo "Running Prisma seed script..."
        node prisma/seed.js
        if [ $? -ne 0 ]; then
            echo "Warning: Prisma seed failed, continuing..."
        fi
    fi
else
    echo "Skipping Prisma steps (not dev mode)"
fi

# ------------------------------------------------------------------------------
# Start Node.js app with PM2
# ------------------------------------------------------------------------------
echo "Starting Node.js app with PM2..."
exec npx pm2-runtime start ecosystem.config.js --only $APP_NAME
