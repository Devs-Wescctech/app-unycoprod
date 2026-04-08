FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY server ./server
COPY public ./public

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "server/index.js"]
