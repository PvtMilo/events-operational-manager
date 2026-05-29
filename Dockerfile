FROM oven/bun:1 AS build

WORKDIR /app

COPY package.json bun.lock* ./
COPY prisma ./prisma

RUN bun install --frozen-lockfile --ignore-scripts

COPY . .

ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"
ENV NUXT_SESSION_PASSWORD="build-time-placeholder-password-minimum-32-characters"

RUN bunx prisma generate
RUN bun run build


FROM node:22-slim AS runner

WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV PORT=8080

COPY --from=build /app/.output ./.output
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.js ./prisma.config.js

CMD ["node", ".output/server/index.mjs"]