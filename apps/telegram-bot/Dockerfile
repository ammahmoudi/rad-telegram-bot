# Multi-stage build for Telegram Bot
# Stage 1: Build dependencies and compile TypeScript
FROM node:22.12-alpine AS builder

WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./
COPY tsconfig*.json ./

# Copy workspace package files
COPY apps/telegram-bot/package*.json ./apps/telegram-bot/
COPY apps/telegram-bot/tsconfig.json ./apps/telegram-bot/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/mcp-planka/package*.json ./packages/mcp-planka/
COPY packages/mcp-planka/tsconfig.json ./packages/mcp-planka/
COPY packages/mcp-rastar/package*.json ./packages/mcp-rastar/
COPY packages/mcp-rastar/tsconfig.json ./packages/mcp-rastar/

# Install dependencies (including devDependencies for build)
RUN npm ci --workspaces

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/mcp-planka ./packages/mcp-planka
COPY packages/mcp-rastar ./packages/mcp-rastar
COPY apps/telegram-bot ./apps/telegram-bot

# Generate Prisma client
RUN npm run prisma:generate

# Build TypeScript projects (telegram-bot and dependencies)
RUN npm run build -w packages/shared
RUN npm run build -w packages/mcp-planka
RUN npm run build -w packages/mcp-rastar
RUN npm run build -w apps/telegram-bot

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
COPY --chown=nodejs:nodejs apps/telegram-bot/package*.json ./apps/telegram-bot/
COPY --chown=nodejs:nodejs packages/shared/package*.json ./packages/shared/
COPY --chown=nodejs:nodejs packages/mcp-planka/package*.json ./packages/mcp-planka/
COPY --chown=nodejs:nodejs packages/mcp-rastar/package*.json ./packages/mcp-rastar/

# Install production dependencies only
RUN npm ci --workspaces

# Copy built artifacts from builder
COPY --from=builder --chown=nodejs:nodejs /app/apps/telegram-bot/dist ./apps/telegram-bot/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/mcp-planka/dist ./packages/mcp-planka/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/mcp-rastar/dist ./packages/mcp-rastar/dist

# Copy Prisma schema and generated client
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/prisma ./packages/shared/prisma
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/prisma.config.ts ./packages/shared/prisma.config.ts
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Install Prisma CLI at the same version as @prisma/client
RUN npm install --global --save-exact "prisma@$(node --print 'require("./node_modules/@prisma/client/package.json").version')"

# Copy locales for i18n
COPY --chown=nodejs:nodejs apps/telegram-bot/src/locales ./apps/telegram-bot/src/locales

# Create data directory for SQLite database
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

# Switch to non-root user
USER nodejs

# Set environment variables
ENV NODE_ENV=production \
    DATABASE_URL="file:/app/data/rastar.db"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Expose port if needed (for health checks)
EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Sync database schema on startup then start the app
CMD ["sh", "-c", "cd packages/shared && npx prisma db push && cd ../.. && node apps/telegram-bot/dist/index.js"]
