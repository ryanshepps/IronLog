FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --prod

FROM base AS build-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

FROM build-deps AS server-build
COPY . .
RUN pnpm run server:build

FROM base AS production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=server-build /app/server_dist ./server_dist
COPY static-build ./static-build
COPY app.json ./app.json
COPY server/templates ./server/templates
COPY assets ./assets
COPY package.json ./package.json
COPY shared ./shared
COPY drizzle.config.ts ./drizzle.config.ts

EXPOSE 5000
CMD ["pnpm", "run", "server:prod"]
