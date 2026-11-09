# Production Dockerfile for TowerTech Society Management System
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci || npm install

# Copy source and build
COPY . .
RUN npm run build

# Runtime Stage
FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy built frontend assets and production server
COPY --from=builder /app/dist ./dist
COPY server.js ./server.js

# Expose port 3000 (Cloud Run startup TCP probe) and 8080 (standard Cloud Run)
EXPOSE 3000
EXPOSE 8080

# Run the Node.js production server
CMD ["node", "server.js"]
