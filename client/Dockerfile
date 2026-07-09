FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/ ./shared/
COPY client/package.json client/tsconfig.json client/tsconfig.app.json client/vite.config.ts client/index.html client/ ./
COPY client/src/ ./client/src/
RUN npm ci --workspaces --include-workspace-root
WORKDIR /app/client
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
