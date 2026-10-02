FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++
RUN corepack enable

FROM base AS deps
COPY . .
RUN pnpm install --frozen-lockfile

FROM deps AS build
# Legacy source imports still use @ai-fsm/* while workspace package names have
# moved to @titan-zero/*. Keep a compatibility link until those imports migrate.
RUN mkdir -p node_modules/@ai-fsm apps/web/node_modules/@ai-fsm \
 && for pkg in domain log money email-templates; do \
      ln -s /app/packages/$pkg node_modules/@ai-fsm/$pkg; \
      ln -s /app/packages/$pkg apps/web/node_modules/@ai-fsm/$pkg; \
    done \
 && pnpm --filter @titan-zero/web build

FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
# Docker sets HOSTNAME to the container ID by default; Next's standalone
# server.js binds to that unless overridden, which makes it unreachable via
# localhost (breaks the healthcheck) even though it's reachable on the
# container's network IP.
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/scripts/sqlite-migrate.mjs ./apps/web/sqlite-migrate.mjs
COPY --from=build /app/db/sqlite ./apps/web/db/sqlite
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["node", "server.js"]
