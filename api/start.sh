#!/bin/sh

# Start Node.js application with PM2 process manager
# PM2 will handle process management, clustering, and auto-restart

# Determine which app to start based on environment
# Default to development if API_MODE is not set
API_MODE=${API_MODE:-development}

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

echo "Starting PM2 with app: $APP_NAME (API_MODE: $API_MODE)"
exec npx pm2-runtime start ecosystem.config.js --only $APP_NAME
