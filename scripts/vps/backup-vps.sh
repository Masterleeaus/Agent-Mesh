#!/usr/bin/env bash
set -Eeuo pipefail
INSTALL_ROOT="${TITAN_ZERO_INSTALL_ROOT:-/opt/titan-zero}"
DB="${INSTALL_ROOT}/shared/data/sqlite/titan-zero.db"
BACKUPS="${INSTALL_ROOT}/backups"
[[ -f "$DB" ]] || { echo "SQLite database not found: $DB" >&2; exit 1; }
mkdir -p "$BACKUPS"; chmod 700 "$BACKUPS"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TARGET="$BACKUPS/titan-zero-$STAMP.db"
# SQLite's VACUUM INTO produces a transactionally consistent standalone copy
# while web and worker continue using WAL mode.
python3 - "$DB" "$TARGET" <<'PY'
import sqlite3, sys
source, target = sys.argv[1:]
conn = sqlite3.connect(source, timeout=30)
try:
    escaped = target.replace("'", "''")
    conn.execute(f"VACUUM INTO '{escaped}'")
finally:
    conn.close()
check = sqlite3.connect(target)
try:
    result = check.execute('PRAGMA integrity_check').fetchone()[0]
    if result != 'ok': raise SystemExit(f'backup integrity_check failed: {result}')
finally: check.close()
PY
chmod 600 "$TARGET"
echo "Created $TARGET"
