#!/bin/sh

pwd

echo deploying makeflow issue synchronizer...

docker-compose build
docker stack deploy --compose-file docker-compose.yml issue-synchronizer
