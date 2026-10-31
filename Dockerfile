FROM node:24.20.0-bookworm-slim AS build

WORKDIR /app
ENV CI=true

RUN npm install --global pnpm@11.27.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build && pnpm prune --prod

FROM node:24.20.0-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production PORT=3000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/server ./server
COPY --from=build /app/src/contracts.ts ./src/contracts.ts
COPY --from=build /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "server/index.ts"]
