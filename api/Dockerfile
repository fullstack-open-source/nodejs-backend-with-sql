# ==============================================================================
# Multi-stage Dockerfile for Node.js Backend
# Optimized for production with security and performance best practices
# ==============================================================================

# ==============================================================================
# Stage 1: Dependencies - Install and cache dependencies
# ==============================================================================
FROM node:20-alpine AS dependencies

WORKDIR /api

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/cache/apk/*

COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma/schema.prisma ./prisma/
COPY credentials/google-backend-master.json ./credentials/

RUN npm ci --prefer-offline --no-audit --progress=false && \
    npm cache clean --force

# ==============================================================================
# Stage 2: Builder - Generate Prisma Client and prepare production build
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /api

# Copy node_modules from dependencies stage
COPY --from=dependencies /api/node_modules ./node_modules

# Copy Prisma files
COPY prisma.config.ts ./
COPY prisma/ ./prisma/
COPY credentials/ ./credentials/

# Generate Prisma Client (needs write access to node_modules/@prisma)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Copy package files
COPY package*.json ./

# Prune dev dependencies and clean cache
RUN npm prune --production && \
    npm cache clean --force

# ==============================================================================
# Stage 3: Production - Final optimized image
# ==============================================================================
FROM node:20-alpine AS production

LABEL maintainer="mrdas" \
      version="1.0" \
      description="Node.js Backend API - Production Image" \
      org.opencontainers.image.title="nodejs-backend-with-postgresql" \
      org.opencontainers.image.description="Production-ready Node.js/Express backend API" \
      org.opencontainers.image.version="1.0.0"

ENV NODE_ENV=production \
    PATH="/api/node_modules/.bin:$PATH"

RUN apk add --no-cache \
    curl \
    dumb-init \
    bash \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S mrdas && \
    adduser -S mrdas -u 1001 -G mrdas

WORKDIR /api

# Copy node_modules with proper ownership
# Ensure Prisma engines directory is writable for runtime operations
COPY --from=builder --chown=mrdas:mrdas /api/node_modules ./node_modules

# Ensure Prisma directories have correct permissions
RUN chown -R mrdas:mrdas /api/node_modules/@prisma 2>/dev/null || true && \
    chmod -R u+w /api/node_modules/@prisma 2>/dev/null || true

# Copy package files
COPY --from=builder --chown=mrdas:mrdas /api/package*.json ./

# Copy Prisma files
COPY --from=builder --chown=mrdas:mrdas /api/prisma.config.ts ./
COPY --from=builder --chown=mrdas:mrdas /api/prisma ./prisma

# Copy application files
COPY --chown=mrdas:mrdas server.js ./
COPY --chown=mrdas:mrdas start.sh ./
COPY --chown=mrdas:mrdas ecosystem.config.js ./
COPY --chown=mrdas:mrdas src ./src
COPY --chown=mrdas:mrdas router ./router

# Copy credentials (required for Google Cloud Storage)
COPY --chown=mrdas:mrdas credentials ./credentials

# Create necessary directories with proper permissions
RUN mkdir -p /api/logs /api/uploads /api/temp /api/tmp && \
    chown -R mrdas:mrdas /api

# Set executable permissions and validate files
RUN chmod +x /api/start.sh && \
    chmod -R 755 /api && \
    echo "=== Validating critical files ===" && \
    test -f /api/server.js || (echo "ERROR: server.js not found!" && exit 1) && \
    test -f /api/start.sh || (echo "ERROR: start.sh not found!" && exit 1) && \
    test -x /api/start.sh || (echo "ERROR: start.sh is not executable!" && exit 1) && \
    echo "=== File permissions ===" && \
    ls -la /api/start.sh && \
    echo "=== File contents (first 3 lines) ===" && \
    head -n 3 /api/start.sh

USER mrdas

EXPOSE 3000 51212

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["/api/start.sh"]
