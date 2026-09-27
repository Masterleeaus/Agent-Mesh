#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p backups
set -a; source ./.env.vps; set +a
STAMP=$(date +%Y%m%d-%H%M%S)
DOCKER=docker
if ! docker info >/dev/null 2>&1; then DOCKER='sudo docker'; fi
$DOCKER compose --env-file .env.vps -f compose.vps.yml exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "backups/titan-zero-${STAMP}.sql.gz"
echo "Created backups/titan-zero-${STAMP}.sql.gz"
