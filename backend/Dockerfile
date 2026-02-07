# Multi-stage build for T-Plat Backend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Build the application (must produce dist/main.js)
RUN npm run build && test -f /app/dist/main.js || (echo "Build failed: dist/main.js not found" && exit 1)

# Production stage
FROM node:20-alpine AS production

# Install dumb-init and postgresql-client for health checks
RUN apk add --no-cache dumb-init postgresql-client

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev && npm cache clean --force

# Copy built application and runtime tsconfig (path aliases @/* resolve to dist/*)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/tsconfig.runtime.json ./tsconfig.json

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh

# Change ownership to app user
RUN chown -R nestjs:nodejs /app && \
    chmod +x /app/docker-entrypoint.sh

# Switch to app user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--", "/app/docker-entrypoint.sh"]

# Start the application (tsconfig-paths resolves @/ aliases at runtime)
CMD ["node", "-r", "tsconfig-paths/register", "dist/main.js"]
