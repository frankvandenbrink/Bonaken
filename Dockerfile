# Bonaken - Multi-stage Dockerfile
# Build and run the multiplayer card game application

# ==============================================================================
# Stage 1: Build stage
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for all workspaces
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/

# Build shared types first, then server, then client
RUN npm run build

# ==============================================================================
# Stage 2: Production stage
# ==============================================================================
FROM node:20-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

# Install production dependencies only
RUN npm ci --omit=dev --workspace=server --workspace=shared

# Copy built artifacts from builder
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/client/dist ./client/dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bonaken -u 1001

USER bonaken

# Expose the application port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start the server
CMD ["node", "server/dist/index.js"]
