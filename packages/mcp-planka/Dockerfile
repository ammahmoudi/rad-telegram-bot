# Multi-stage build for MCP Planka Server
FROM node:22.12-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig*.json ./

# Copy workspace package files
COPY packages/mcp-planka/package*.json ./packages/mcp-planka/
COPY packages/mcp-planka/tsconfig.json ./packages/mcp-planka/

# Install dependencies
RUN npm ci --workspaces

# Copy source code
COPY packages/mcp-planka ./packages/mcp-planka

# Build TypeScript
RUN npm run build -w packages/mcp-planka

# Production image
FROM node:22.12-alpine AS production

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs packages/mcp-planka/package*.json ./packages/mcp-planka/

# Install production dependencies
RUN npm ci --workspaces --omit=dev

# Copy built artifacts
COPY --from=builder --chown=nodejs:nodejs /app/packages/mcp-planka/dist ./packages/mcp-planka/dist

USER nodejs

ENV NODE_ENV=production \
    MCP_TRANSPORT=http \
    PORT=3100

# Health check
# HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
#     CMD node -e "require('http').get('http://localhost:3100/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Expose MCP server port
EXPOSE 3100

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "packages/mcp-planka/dist/index.js"]
