FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY apps/web/package.json apps/web/

RUN npm ci --legacy-peer-deps

COPY apps/web/ apps/web/
RUN npm run build -w apps/web

FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache tini

COPY --from=build /app/apps/web/package.json ./apps/web/
COPY --from=build /app/apps/web/.next/ ./apps/web/.next/
COPY --from=build /app/apps/web/public/ ./apps/web/public/
COPY --from=build /app/apps/web/node_modules/ ./apps/web/node_modules/
COPY --from=build /app/node_modules/ ./node_modules/
COPY --from=build /app/package*.json ./

EXPOSE 3000

ENV NODE_ENV=production

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node_modules/.bin/next", "start", "-p", "3000", "--prefix", "apps/web"]