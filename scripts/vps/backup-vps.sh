#!/usr/bin/env bash
set -Eeuo pipefail

INSTALL_ROOT="${TITAN_ZERO_INSTALL_ROOT:-/opt/titan-zero}"
CURRENT_LINK="${INSTALL_ROOT}/current"
ENV_FILE="${INSTALL_ROOT}/shared/env/.env"
DATA_ROOT="${INSTALL_ROOT}/shared/data"
BACKUP_DIR="${INSTALL_ROOT}/backups"
COMPOSE_FILE="${CURRENT_LINK}/infra/compose.vps.yml"

[[ -f "$ENV_FILE" ]] || { echo "Titan Zero environment not found: $ENV_FILE" >&2; exit 1; }
[[ -f "$COMPOSE_FILE" ]] || { echo "Titan Zero current release not found: $COMPOSE_FILE" >&2; exit 1; }

set -a
source "$ENV_FILE"
set +a

export TZ_ENV_FILE="$ENV_FILE"
export TZ_DATA_ROOT="$DATA_ROOT"
export APP_PORT="${APP_PORT:-3000}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TARGET="${BACKUP_DIR}/titan-zero-${STAMP}.sql.gz"
TEMP="${TARGET}.partial"

cleanup() { rm -f "$TEMP"; }
trap cleanup EXIT

if ! docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
    pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
  echo "PostgreSQL is not ready; backup aborted." >&2
  exit 1
fi

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump --no-owner --no-privileges -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip -9 > "$TEMP"

gzip -t "$TEMP"
[[ -s "$TEMP" ]] || { echo "Backup is empty; refusing to publish it." >&2; exit 1; }
mv "$TEMP" "$TARGET"
chmod 600 "$TARGET"
trap - EXIT

echo "Created $TARGET"
