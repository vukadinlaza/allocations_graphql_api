# Install dependencies only when needed
FROM node:16-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY . .
ARG NPM_TOKEN

COPY .npmrc-ci .npmrc
RUN yarn install --frozen-lockfile

FROM gcr.io/distroless/nodejs:16 as runner
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src ./src
EXPOSE 4000

CMD ["src/server.js"]
