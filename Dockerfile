FROM node:22-alpine AS base
WORKDIR /app

FROM base AS installer
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=installer /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --omit=dev

FROM base AS runner
RUN addgroup --system --gid 1001 headtrixz && adduser --system --uid 1001 headtrixz
USER headtrixz
ENV NODE_ENV=production

COPY --from=builder /app/assets ./assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

CMD ["sh", "-c", "node dist/database/migrate.js && node dist/index.js"]
