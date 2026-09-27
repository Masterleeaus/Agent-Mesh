#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
DOCKER=docker
if ! docker info >/dev/null 2>&1; then DOCKER='sudo docker'; fi
$DOCKER compose --env-file .env.vps -f compose.vps.yml build
$DOCKER compose --env-file .env.vps -f compose.vps.yml up -d --remove-orphans
$DOCKER image prune -f
