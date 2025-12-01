#!/bin/bash
set -euo pipefail

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
# Ensure Prisma Client is generated (if needed)
# ------------------------------------------------------------------------------
echo "Ensuring Prisma Client is generated..."
if [ ! -d "node_modules/.prisma/client" ] || [ ! -d "node_modules/@prisma/client" ]; then
    echo "Prisma Client not found, generating..."
    DATABASE_URL="${DATABASE_URL:-postgresql://dummy:dummy@localhost:5432/dummy}" npx prisma generate || {
        echo "Warning: Prisma generate failed, but continuing..."
    }
fi

# ------------------------------------------------------------------------------
# Run Prisma DB push + seed ONLY in development
# ------------------------------------------------------------------------------
if [ "$API_MODE" = "development" ]; then
    echo "Running Prisma steps (dev only)..."

    echo "Running Prisma DB push..."
    npx prisma db push --accept-data-loss || {
        echo "Error: Prisma db push failed!"
        exit 1
    }

    if [ -f prisma/seed.js ]; then
        echo "Running Prisma seed script..."
        # Run seed with timeout (5 minutes max)
        timeout 120 node prisma/seed.js seed || {
            SEED_EXIT_CODE=$?
            if [ $SEED_EXIT_CODE -eq 124 ]; then
                echo "Warning: Prisma seed timed out after 5 minutes, continuing..."
            else
                echo "Warning: Prisma seed failed (exit code: $SEED_EXIT_CODE), continuing..."
            fi
        }
    fi

    # ------------------------------------------------------------------------------
    # Start Prisma Studio (Database Dashboard) in development mode
    # ------------------------------------------------------------------------------
    echo "Starting Prisma Studio (Database Dashboard)..."
    # Use PRISMA_STUDIO_PORT env var (set from Dockerfile/docker-compose) with default 51212
    # This is the container port where Prisma Studio will run
    PRISMA_STUDIO_CONTAINER_PORT=${PRISMA_STUDIO_PORT:-51212}
    npx prisma studio --port ${PRISMA_STUDIO_CONTAINER_PORT} --browser none > /dev/null 2>&1 &
    PRISMA_STUDIO_PID=$!
    echo "✅ Prisma Studio started on port ${PRISMA_STUDIO_CONTAINER_PORT} (PID: $PRISMA_STUDIO_PID)"
    echo "   Access Prisma Studio at: http://localhost:${PRISMA_STUDIO_PORT:-8901} (from host machine)"
else
    echo "Skipping Prisma steps (not dev mode)"
fi

# ------------------------------------------------------------------------------
# Start Node.js app with PM2
# ------------------------------------------------------------------------------
echo "Starting Node.js app with PM2..."
exec npx pm2-runtime start ecosystem.config.js --only $APP_NAME
