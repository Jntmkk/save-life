FROM node:22-slim AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

RUN npm install -g pnpm@11.10.0 && pnpm install --frozen-lockfile

FROM node:22-slim AS builder

WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

ARG VITE_AUTH_API_URL
ENV VITE_AUTH_API_URL=${VITE_AUTH_API_URL}

RUN npm run build

FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN npm install -g serve

COPY --from=builder /app/dist ./

USER node

EXPOSE 3000

CMD ["serve", "-l", "3000"]
