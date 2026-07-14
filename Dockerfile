# Stage 1: Build client SPA
FROM node:22-alpine AS client-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/ ./shared/
COPY client/package.json client/tsconfig.json client/tsconfig.app.json client/vite.config.ts client/index.html ./client/
COPY client/src/ ./client/src/
RUN npm ci --workspaces --include-workspace-root
WORKDIR /app/client
RUN npm run build

# Stage 2: Production server (serves API + client SPA)
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/ ./shared/
COPY server/package.json ./server/
COPY server/seed.ts ./server/
COPY server/src/ ./server/src/
COPY server/entrypoint.sh ./server/
COPY --from=client-build /app/client/dist ./client/dist
RUN npm ci --workspaces --include-workspace-root
RUN chmod +x /app/server/entrypoint.sh
RUN mkdir -p /app/server/data
WORKDIR /app/server
ENV SERVE_CLIENT=true
ENV PORT=3001
ENTRYPOINT ["./entrypoint.sh"]
