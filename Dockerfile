FROM node:10

WORKDIR /app

COPY package.json     /app/package.json
COPY yarn.lock        /app/yarn.lock
COPY .config/         /app/.config/
COPY bld/             /app/bld/

RUN yarn

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD node bld/program/main.js
