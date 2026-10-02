#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

# Transitional Titan Zero VPS entrypoint.
# Native Titan/AI-FSM is the default field-service product and Frappe is optional.
# The maintained installer currently boots the compatibility/runtime SQLite path;
# it is NOT full production certification of database-per-company native FSM
# storage or the persistent Workforce host. Keep this public entrypoint stable
# while #811/#322 converge the underlying composition.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SQLITE_INSTALLER="${SCRIPT_DIR}/install-sqlite-vps.sh"

if [[ ! -f "$SQLITE_INSTALLER" ]]; then
  printf '[Titan Zero] ERROR: SQLite VPS installer not found: %s\n' "$SQLITE_INSTALLER" >&2
  exit 1
fi

exec bash "$SQLITE_INSTALLER" "$@"
