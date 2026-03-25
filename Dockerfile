FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY shared/package.json ./shared/

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm db:generate && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable

ENV NODE_ENV=production
ENV PORT=4000

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
COPY shared/package.json ./shared/package.json

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/shared/dist ./shared/dist
RUN pnpm --filter server db:generate

EXPOSE 4000

CMD ["pnpm", "--filter", "server", "start:docker"]
