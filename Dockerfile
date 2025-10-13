# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --include=dev

FROM base AS build
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/prisma ./prisma
RUN chown -R node:node /app
USER node
EXPOSE 4173
CMD ["sh", "-c", "export NODE_ENV=${NODE_ENV:-production} && npx prisma migrate deploy && node scripts/preview.js"]
