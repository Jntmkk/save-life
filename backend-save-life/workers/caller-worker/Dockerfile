FROM node:18-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production
ENV III_URL=ws://backend:49134

CMD ["npx", "tsx", "src/worker.ts"]
