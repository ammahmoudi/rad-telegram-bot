# Multi-stage build for Link Portal
# Stage 1: Build dependencies and compile TypeScript
FROM node:22.12-alpine AS builder

WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./
COPY tsconfig*.json ./

# Copy workspace package files
COPY apps/link-portal/package*.json ./apps/link-portal/
COPY apps/link-portal/tsconfig.json ./apps/link-portal/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/

# Copy Prisma schema first (needed for postinstall)
COPY packages/shared/prisma ./packages/shared/prisma
COPY packages/shared/prisma.config.ts ./packages/shared/prisma.config.ts

# Install dependencies (including devDependencies for build)
RUN npm ci --workspaces

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/link-portal ./apps/link-portal

# Accept DATABASE_URL as build argument from Dokploy
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Explicitly generate Prisma client after npm ci
RUN npm run prisma:generate -w packages/shared

# Build TypeScript projects (only link-portal and shared)
RUN npm run build -w packages/shared
RUN npm run build -w apps/link-portal

# Stage 2: Production image
FROM node:22.12-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy root package files
COPY --chown=nodejs:nodejs package*.json ./

# Copy workspace package files
COPY --chown=nodejs:nodejs apps/link-portal/package*.json ./apps/link-portal/
COPY --chown=nodejs:nodejs packages/shared/package*.json ./packages/shared/

# Install production dependencies only
RUN npm ci --workspaces

# Copy generated Prisma client from builder (must be after npm ci)
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy built artifacts from builder
COPY --from=builder --chown=nodejs:nodejs /app/apps/link-portal/dist ./apps/link-portal/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/dist ./packages/shared/dist

# Copy locale files for i18n
COPY --from=builder --chown=nodejs:nodejs /app/apps/link-portal/src/locales ./apps/link-portal/dist/locales

# Create data directory
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

# Switch to non-root user
USER nodejs

# Set environment variables
ENV NODE_ENV=production \
    PORT=3002

# Health check
# HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
#     CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Expose portal port
EXPOSE 3002

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the server (no migrations - admin panel handles database)
CMD ["node", "apps/link-portal/dist/server.js"]
