FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/

RUN npm ci --legacy-peer-deps

COPY packages/shared/ packages/shared/
RUN npm run build -w packages/shared

COPY apps/api/ apps/api/
RUN npm run build -w apps/api

FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache tini

COPY --from=build /app/apps/api/build/ ./apps/api/build/
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/apps/api/node_modules/ ./apps/api/node_modules/
COPY --from=build /app/apps/ ./apps/
COPY --from=build /app/packages/ ./packages/
COPY --from=build /app/node_modules/ ./node_modules/
COPY --from=build /app/package*.json ./

EXPOSE 3001

ENV NODE_ENV=production

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/api/scripts/start-build.mjs"]