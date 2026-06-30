FROM node:24-alpine AS build

WORKDIR /app

ARG EXPO_PUBLIC_API_BASE_URL=__EXPO_PUBLIC_API_BASE_URL__
ENV EXPO_PUBLIC_API_BASE_URL=${EXPO_PUBLIC_API_BASE_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run web:build

FROM nginx:1.27-alpine

ENV EXPO_PUBLIC_API_BASE_URL=/api/v1
ENV API_PROXY_ORIGIN=http://host.docker.internal:8080

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.d/40-runtime-env.sh /docker-entrypoint.d/40-runtime-env.sh
COPY --from=build /app/dist /usr/share/nginx/html

RUN chmod +x /docker-entrypoint.d/40-runtime-env.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
