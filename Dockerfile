FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app

# Install the dependencies
FROM base AS installer
COPY package.json package-lock.json ./
RUN npm ci

# Build the project
FROM base AS builder
COPY --from=installer /app/node_modules ./node_modules
COPY . .

RUN npm run db:generate
RUN npm run build

# Run the project
FROM base AS runner
RUN addgroup --system --gid 1001 headtrixz \
    && adduser --system --uid 1001 headtrixz
USER headtrixz

COPY --from=builder /app/assets ./assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env ./.env

CMD ["npm", "run", "start"]
