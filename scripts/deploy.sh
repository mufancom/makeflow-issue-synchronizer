#!/bin/sh
pwd

VERSION=${1:-$(date +%s)};

echo "deploying '$VERSION' makeflow issue synchronizer..."

VERSION=$VERSION docker-compose build
VERSION=$VERSION docker stack deploy --compose-file docker-compose.yml issue-synchronizer
