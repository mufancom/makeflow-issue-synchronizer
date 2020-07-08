#!/bin/sh
pwd

VERSION=${1:-$(date +%s)};

echo "deploying '$VERSION' of makeflow issue synchronizer..."

VERSION=$VERSION SOCKS_PROXY=$SOCKS_PROXY docker-compose build
VERSION=$VERSION SOCKS_PROXY=$SOCKS_PROXY docker stack deploy --compose-file docker-compose.yml issue-synchronizer
