# Multi-stage build for MCP Rastar Server
FROM node:22.12-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig*.json ./

# Copy workspace package files
COPY packages/mcp-rastar/package*.json ./packages/mcp-rastar/
COPY packages/mcp-rastar/tsconfig.json ./packages/mcp-rastar/

# Install dependencies
RUN npm ci --workspaces

# Copy source code
COPY packages/mcp-rastar ./packages/mcp-rastar

# Build TypeScript
RUN npm run build -w packages/mcp-rastar

# Production image
FROM node:22.12-alpine AS production

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs packages/mcp-rastar/package*.json ./packages/mcp-rastar/

# Install production dependencies
RUN npm ci --workspaces --omit=dev

# Copy built artifacts
COPY --from=builder --chown=nodejs:nodejs /app/packages/mcp-rastar/dist ./packages/mcp-rastar/dist

USER nodejs

ENV NODE_ENV=production \
    MCP_TRANSPORT=http \
    PORT=3101

# Health check
# HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
#     CMD node -e "require('http').get('http://localhost:3101/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Expose MCP server port
EXPOSE 3101

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "packages/mcp-rastar/dist/index.js"]
