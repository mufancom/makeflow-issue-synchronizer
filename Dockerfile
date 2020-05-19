FROM node:12

WORKDIR /app

COPY package.json         /app/package.json
COPY yarn.lock            /app/yarn.lock
COPY docker/config.js    /app/.config/server.js
COPY src/                 /app/src/

RUN yarn && yarn build:program

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD node bld/program/main.js
