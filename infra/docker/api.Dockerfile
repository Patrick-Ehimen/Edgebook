FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Production dependencies only
FROM base AS prod-deps
COPY . /app
WORKDIR /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile
RUN pnpm --filter=@edgebook/db db:generate

# Full build — nest build bundles @edgebook/* workspace packages inline via webpack
FROM base AS build
COPY . /app
WORKDIR /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm --filter=@edgebook/db db:generate
RUN pnpm --filter=api build

# Lean runtime image
FROM base
WORKDIR /app
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/packages/db/prisma /app/packages/db/prisma
COPY --from=build /app/apps/api/package.json /app/apps/api/package.json

EXPOSE 3001
CMD ["node", "--max-old-space-size=350", "apps/api/dist/main.js"]
