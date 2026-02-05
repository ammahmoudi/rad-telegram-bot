# Multi-stage build for Next.js Admin Panel
# Stage 1: Build dependencies and compile Next.js
FROM node:22.12-alpine AS builder

WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./
COPY tsconfig*.json ./

# Copy workspace package files
COPY apps/admin-panel/package*.json ./apps/admin-panel/
COPY apps/admin-panel/tsconfig.json ./apps/admin-panel/
COPY apps/admin-panel/next.config.mjs ./apps/admin-panel/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/job-scheduler/package*.json ./packages/job-scheduler/
COPY packages/job-scheduler/tsconfig.json ./packages/job-scheduler/
COPY packages/rastar-service/package*.json ./packages/rastar-service/
COPY packages/rastar-service/tsconfig.json ./packages/rastar-service/

# Copy Prisma schema and migrations first (needed for postinstall)
COPY packages/shared/prisma ./packages/shared/prisma
COPY packages/shared/prisma.config.ts ./packages/shared/prisma.config.ts

# Install dependencies (including devDependencies for build)
RUN npm ci --workspaces

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/rastar-service ./packages/rastar-service
COPY packages/job-scheduler ./packages/job-scheduler
COPY apps/admin-panel ./apps/admin-panel
COPY scripts/admin-panel-entrypoint.sh ./scripts/admin-panel-entrypoint.sh
COPY scripts/create-admin.ts ./scripts/create-admin.ts
COPY scripts/create-default-pack.ts ./scripts/create-default-pack.ts

# Accept DATABASE_URL as build argument from Dokploy
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Explicitly generate Prisma client after npm ci
RUN npm run prisma:generate -w packages/shared

# Build shared package first (needed by admin-panel and job-scheduler)
RUN npm run build -w packages/shared

# Build rastar-service package (needed by job-scheduler)
RUN npm run build -w packages/rastar-service

# Build job-scheduler package (needed by admin-panel)
RUN npm run build -w packages/job-scheduler

# Build Next.js with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run admin:build

# Stage 2: Production image
FROM node:22.12-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy Next.js standalone output
COPY --from=builder --chown=nodejs:nodejs /app/apps/admin-panel/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/admin-panel/.next/static ./apps/admin-panel/.next/static

# Copy public directory if it exists (optional)
# COPY --from=builder --chown=nodejs:nodejs /app/apps/admin-panel/public ./apps/admin-panel/public

# Copy Prisma files and ALL node_modules (standalone mode doesn't include everything needed for migrations)
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/prisma ./packages/shared/prisma
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/prisma.config.ts ./packages/shared/prisma.config.ts
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/job-scheduler/dist ./packages/job-scheduler/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/rastar-service/dist ./packages/rastar-service/dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/scripts ./scripts

# Install Prisma CLI at the same version as @prisma/client
RUN npm install --global --save-exact "prisma@$(node --print 'require("./node_modules/@prisma/client/package.json").version')"

# Install tsx for running TypeScript scripts
RUN npm install --global tsx

# Copy entrypoint script
COPY --from=builder --chown=nodejs:nodejs /app/scripts/admin-panel-entrypoint.sh /app/admin-panel-entrypoint.sh
RUN chmod +x /app/admin-panel-entrypoint.sh

# Copy initialization scripts
COPY --from=builder --chown=nodejs:nodejs /app/scripts/create-admin.ts /app/scripts/create-admin.ts
COPY --from=builder --chown=nodejs:nodejs /app/scripts/create-default-pack.ts /app/scripts/create-default-pack.ts

# Copy shared package dist (needed by scripts)
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/dist /app/packages/shared/dist

# Create data directory for SQLite database
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

# Switch to non-root user
USER nodejs

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    DATABASE_URL="file:/app/data/rastar.db" \
    NEXT_TELEMETRY_DISABLED=1

# Health check
# HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
#    CMD node -e "require('http').get('http://127.0.0.1:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Switch to the directory where server.js actually lives
WORKDIR /app/apps/admin-panel

# Expose Next.js port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Use entrypoint script that handles migrations and admin creation
CMD ["/app/admin-panel-entrypoint.sh"]
