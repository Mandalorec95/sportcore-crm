FROM node:22-alpine AS builder

WORKDIR /app

# Copy only package files first (this layer is cached unless package*.json changes)
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY nest-cli.json ./

# Install dependencies with retry settings for network instability
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-factor 2 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 300000 \
  && npm config set fetch-timeout 300000 \
  && npm ci

# Copy Prisma schema before source code
COPY prisma ./prisma
COPY prisma.config.js ./prisma.config.js

# Now copy remaining source code
COPY src ./src

# Generate Prisma client
RUN npx prisma generate

# Build NestJS app
RUN npm run build

# Runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy only package files
COPY package*.json ./

# Install production dependencies only
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-factor 2 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 300000 \
  && npm config set fetch-timeout 300000 \
  && npm ci --omit=dev

# Install ts-node for seed script (needed at runtime)
RUN npm install ts-node@^10.9.2 typescript@^5.7.3

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy Prisma schema and config
COPY prisma ./prisma
COPY --from=builder /app/prisma.config.js ./prisma.config.js

# Keep Prisma Client in sync with the copied schema in the runtime image
RUN rm -rf ./node_modules/.prisma/client \
  && npx prisma generate --schema=/app/prisma/schema.prisma

# Create logs directory
RUN mkdir -p ./logs

# Expose port
EXPOSE 4000

# Healthcheck
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD curl -f http://localhost:4000/api/v1/health || exit 1

# Run migrations and start application
CMD sh -c "npx prisma db push --accept-data-loss && node dist/src/main"
