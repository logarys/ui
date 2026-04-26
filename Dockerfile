FROM node:24-bookworm-slim AS builder

WORKDIR /app

ARG PUBLIC_LOGARYS_API_URL=http://localhost:3000
ENV PUBLIC_LOGARYS_API_URL=${PUBLIC_LOGARYS_API_URL}

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN npm run build

FROM caddy:latest

COPY --from=builder /app/build /srv
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
