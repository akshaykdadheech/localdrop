# ── Stage 1: build client ──────────────────────────────────────────────────
FROM node:20-alpine AS client-build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci --workspace=client
COPY client ./client
COPY tsconfig.base.json ./
RUN npm run build --workspace=client

# ── Stage 2: build server ─────────────────────────────────────────────────
FROM node:20-alpine AS server-build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci --workspace=server
COPY server ./server
COPY tsconfig.base.json ./
RUN npm run build --workspace=server

# ── Stage 3: production image ─────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci --workspace=server --omit=dev

COPY --from=server-build /app/server/dist ./server/dist
COPY --from=client-build /app/client/dist ./client/dist

ENV PORT=3001
ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "server/dist/index.js"]
