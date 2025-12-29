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

# Install dependencies (including devDependencies for build)
RUN npm ci --workspaces

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/admin-panel ./apps/admin-panel

# Generate Prisma client
RUN npm run prisma:generate

# Build shared package first (needed by admin-panel)
RUN npm run build -w packages/shared

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
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Install Prisma CLI at the same version as @prisma/client
RUN npm install --global --save-exact "prisma@$(node --print 'require("./node_modules/@prisma/client/package.json").version')"

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
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Expose Next.js port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run migrations and start Next.js server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./packages/shared/prisma/schema.prisma --config=./packages/shared/prisma.config.ts && node apps/admin-panel/server.js"]
