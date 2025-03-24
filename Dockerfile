FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY --chown=node:node . .

USER node

CMD ["npm", "run", "start"]
