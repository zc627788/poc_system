ARG NODE_IMAGE=docker.m.daocloud.io/library/node:22-alpine
ARG NGINX_IMAGE=docker.m.daocloud.io/library/nginx:1.27-alpine

FROM ${NODE_IMAGE} AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
ARG VITE_API_BASE_URL=/api
ARG VITE_SITE_BASE_URL=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_SITE_BASE_URL=${VITE_SITE_BASE_URL}
RUN npm run build

FROM ${NGINX_IMAGE}
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
