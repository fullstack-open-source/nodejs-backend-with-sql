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

COPY --from=dependencies /api/node_modules ./node_modules

COPY prisma.config.ts ./
COPY prisma/ ./prisma/
COPY credentials/ ./credentials/

RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

COPY package*.json ./

RUN npm prune --production && \
    npm cache clean --force

# ==============================================================================
# Stage 3: Production - Final optimized image
# ==============================================================================
FROM node:20-alpine AS production

LABEL maintainer="Node.js Backend Team" \
      version="1.0.0" \
      description="Node.js Backend API - Express Version" \
      org.opencontainers.image.title="nodejs-backend-with-postgresql" \
      org.opencontainers.image.description="Production-ready Node.js/Express backend API" \
      org.opencontainers.image.version="1.0.0"

RUN addgroup -g 1001 -S mrdas && \
    adduser -S mrdas -u 1001 -G mrdas

WORKDIR /api

RUN apk add --no-cache \
    curl \
    dumb-init \
    xdg-utils \
    && rm -rf /var/cache/apk/*

COPY --from=builder --chown=mrdas:mrdas /api/node_modules ./node_modules

COPY --from=builder --chown=mrdas:mrdas /api/package*.json ./

COPY --from=builder --chown=mrdas:mrdas /api/prisma.config.ts ./
COPY --from=builder --chown=mrdas:mrdas /api/prisma ./prisma
COPY --from=builder --chown=mrdas:mrdas /api/credentials ./credentials

COPY --chown=mrdas:mrdas server.js ./
COPY --chown=mrdas:mrdas start.sh ./
COPY --chown=mrdas:mrdas ecosystem.config.js ./
COPY --chown=mrdas:mrdas src ./src
COPY --chown=mrdas:mrdas router ./router
COPY --chown=mrdas:mrdas credentials ./credentials

RUN mkdir -p /api/logs && \
    chown -R mrdas:mrdas /api/logs && \
    chmod -R 755 /api/logs

RUN chmod +x /api/start.sh

USER mrdas
EXPOSE 3000 51212

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1


ENTRYPOINT ["dumb-init", "--"]
CMD ["/api/start.sh"]
