FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/ ./shared/
COPY server/package.json ./server/
COPY server/seed.ts ./server/
COPY server/src/ ./server/src/
WORKDIR /app
RUN npm ci --workspaces --include-workspace-root
COPY server/entrypoint.sh ./server/
RUN chmod +x /app/server/entrypoint.sh
RUN mkdir -p /app/data
WORKDIR /app/server
ENTRYPOINT ["./entrypoint.sh"]
