FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/ ./shared/
COPY server/package.json server/tsconfig.json server/src/ ./server/
WORKDIR /app/server
RUN npm ci --workspaces --include-workspace-root
RUN npx tsc

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/package.json ./
# Copy .ts migration files so knex can find them at runtime (extension: "ts")
COPY server/src/db/migrations/ ./dist/db/migrations/
COPY server/entrypoint.sh ./
RUN chmod +x entrypoint.sh
RUN mkdir -p /app/data
EXPOSE 3001
ENTRYPOINT ["./entrypoint.sh"]
