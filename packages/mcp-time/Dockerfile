# Multi-stage build for MCP Time Server
FROM node:22.12-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig*.json ./

# Copy workspace package files
COPY packages/mcp-time/package*.json ./packages/mcp-time/
COPY packages/mcp-time/tsconfig.json ./packages/mcp-time/

# Install dependencies
RUN npm ci --workspaces

# Copy source code
COPY packages/mcp-time ./packages/mcp-time

# Build TypeScript
RUN npm run build -w packages/mcp-time

# Production image
FROM node:22.12-alpine AS production

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs packages/mcp-time/package*.json ./packages/mcp-time/

# Install production dependencies
RUN npm ci --workspaces --omit=dev

# Copy built artifacts
COPY --from=builder --chown=nodejs:nodejs /app/packages/mcp-time/dist ./packages/mcp-time/dist

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3102

# Set environment
ENV NODE_ENV=production
ENV MCP_TRANSPORT=http
ENV PORT=3102

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3102/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Run the server with dumb-init
CMD ["dumb-init", "node", "packages/mcp-time/dist/index.js"]
