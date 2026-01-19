#!/bin/bash
# Update script for Bonaken
# Usage: ./update.sh

set -e

cd /srv/docker/bonaken

echo "==> Pulling latest changes..."
GIT_SSH_COMMAND="ssh -i /root/.ssh/bonaken_deploy -o IdentitiesOnly=yes" git pull

echo "==> Building and restarting containers..."
docker compose up -d --build

echo "==> Cleaning up old images..."
docker image prune -f

echo "==> Done! Site updated at https://bonaken.frankvdbrink.nl"
