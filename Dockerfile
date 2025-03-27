FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY --chown=node:node . .

USER node

CMD ["npm", "run", "start"]
