# syntax=docker/dockerfile:1

# ---- Build: type-check and bundle the app ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Serve: nginx serves the bundle and proxies the news APIs ----
FROM nginx:stable-alpine

# The nginx image renders /etc/nginx/templates/*.template into conf.d at
# startup, substituting the API keys passed in as environment variables.
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/news-api-proxy.conf /etc/nginx/snippets/news-api-proxy.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO /dev/null http://127.0.0.1/ || exit 1
