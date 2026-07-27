FROM node:24-alpine AS build

WORKDIR /app

ARG BASE_URL=__BASE_URL__
ENV EXPO_PUBLIC_BASE_URL=${BASE_URL}

COPY package.json package-lock.json ./
RUN npm i

COPY . .
RUN npm run web:build

FROM nginx:1.27-alpine

ENV BASE_URL=http://localhost:8014/api/v1

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.d/40-runtime-env.sh /docker-entrypoint.d/40-runtime-env.sh
COPY --from=build /app/dist /usr/share/nginx/html

RUN chmod +x /docker-entrypoint.d/40-runtime-env.sh \
    && grep -R -q '__BASE_URL__' /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
