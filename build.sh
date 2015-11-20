#!/bin/bash

rm -rf build/
docker build -t quickdraw-app .

# clean up old images
docker rmi -f $(docker images -f "dangling=true" -q)

# save a tar'd up version to build/
mkdir build/
docker save quickdraw-app | gzip > ./build/quickdraw-app.docker.tgz
