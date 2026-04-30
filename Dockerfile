FROM node:24-bookworm-slim AS builder

WORKDIR /app

ENV PUBLIC_LOGARYS_API_URL=${PUBLIC_LOGARYS_API_URL}

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4173

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --include=dev; else npm install; fi \
  && npm cache clean --force

COPY --from=builder /app/build ./build
COPY --from=builder /app/.svelte-kit ./.svelte-kit
COPY --from=builder /app/static ./static
COPY --from=builder /app/svelte.config.js ./svelte.config.js
COPY --from=builder /app/vite.config.ts ./vite.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY ./docker/entrypoint /
RUN chmod 700 /entrypoint

EXPOSE 4173

ENTRYPOINT /entrypoint && npm run start
