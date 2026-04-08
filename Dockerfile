FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY . .

RUN npm run build

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "server/index.js"]
