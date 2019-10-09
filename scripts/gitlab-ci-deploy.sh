#!/bin/sh

cd /var/www/makeflow-issue-synchronizer/program

rm -r ./*

mkdir .config

cp ../config/server.js ./.config/

cp -r \
  $CI_PROJECT_DIR/package.json \
  $CI_PROJECT_DIR/yarn.lock \
  $CI_PROJECT_DIR/Dockerfile \
  $CI_PROJECT_DIR/docker-compose.yml
  $CI_PROJECT_DIR/bld \
  $CI_PROJECT_DIR/node_modules \
  ./

docker-compose --project-name makeflow-issue-synchronizer --file docker-compose.yml up --build
