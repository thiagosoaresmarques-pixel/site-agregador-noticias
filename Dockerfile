# ── Build stage ──────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Production stage ─────────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY server/ ./server/
COPY agents/ ./agents/

# Create data directory
RUN mkdir -p server/data

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server/index.js"]
