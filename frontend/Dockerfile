FROM node:22-alpine AS builder

WORKDIR /app

ARG BACKEND_URL=http://backend:4000
ARG NEXT_PUBLIC_API_URL=/api/v1
ENV BACKEND_URL=$BACKEND_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy only package files first (this layer is cached unless package*.json changes)
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.ts ./
COPY postcss.config.mjs ./

# Install dependencies with retry settings for network instability
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-factor 2 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 300000 \
  && npm config set fetch-timeout 300000 \
  && npm ci

# Copy remaining source code
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY hooks ./hooks
COPY public ./public

# Build Next.js app
RUN echo "Building frontend with BACKEND_URL=$BACKEND_URL NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL" \
  && npm run build

# Runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install curl for healthchecks
RUN apk add --no-cache curl

# Set production environment
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD curl -f http://localhost:3000 || exit 1

# Start application
CMD ["node", "server.js"]
