FROM node:22-alpine
WORKDIR /app

# Copy only the workspace manifests needed (root + server + shared)
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

# Install only server + shared workspaces (skip client — not needed in container)
RUN npm ci --workspace=server --workspace=shared --include-workspace-root

# Copy source code
COPY shared/ ./shared/
COPY server/src/ ./server/src/
COPY server/seed.ts ./server/
COPY server/entrypoint.sh ./server/
RUN chmod +x /app/server/entrypoint.sh

RUN mkdir -p /app/data
WORKDIR /app/server
ENTRYPOINT ["./entrypoint.sh"]
