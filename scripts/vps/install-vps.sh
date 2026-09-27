#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

# Canonical Titan Zero VPS installation is SQLite-first. Keep this entrypoint as
# the stable public installer while delegating to the maintained SQLite installer.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SQLITE_INSTALLER="${SCRIPT_DIR}/install-sqlite-vps.sh"

if [[ ! -f "$SQLITE_INSTALLER" ]]; then
  printf '[Titan Zero] ERROR: SQLite VPS installer not found: %s\n' "$SQLITE_INSTALLER" >&2
  exit 1
fi

exec bash "$SQLITE_INSTALLER" "$@"
