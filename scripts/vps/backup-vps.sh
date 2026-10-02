#!/usr/bin/env bash
set -Eeuo pipefail

INSTALL_ROOT="${TITAN_ZERO_INSTALL_ROOT:-/opt/titan-zero}"
DB="${INSTALL_ROOT}/shared/data/sqlite/titan-zero.db"
WORKFORCE_DB="${INSTALL_ROOT}/shared/data/runtime/workforce.db"
BACKUP_DIR="${INSTALL_ROOT}/backups"

[[ -f "$DB" ]] || { echo "SQLite database not found: $DB" >&2; exit 1; }
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TARGET="${BACKUP_DIR}/titan-zero-${STAMP}.db"
WORKFORCE_TARGET="${BACKUP_DIR}/titan-zero-workforce-${STAMP}.db"

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
    result = check.execute("PRAGMA integrity_check").fetchone()[0]
    if result != "ok":
        raise SystemExit(f"backup integrity_check failed: {result}")
finally:
    check.close()
PY

[[ -s "$TARGET" ]] || { echo "Backup is empty; refusing to publish it." >&2; exit 1; }
chmod 600 "$TARGET"
echo "Created $TARGET"

if [[ -f "$WORKFORCE_DB" ]]; then
  python3 - "$WORKFORCE_DB" "$WORKFORCE_TARGET" <<'PY'
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
    result = check.execute("PRAGMA integrity_check").fetchone()[0]
    if result != "ok": raise SystemExit(f"workforce backup integrity_check failed: {result}")
finally:
    check.close()
PY
  [[ -s "$WORKFORCE_TARGET" ]] || { echo "Workforce backup is empty; refusing to publish it." >&2; exit 1; }
  chmod 600 "$WORKFORCE_TARGET"
  echo "Created $WORKFORCE_TARGET"
fi
