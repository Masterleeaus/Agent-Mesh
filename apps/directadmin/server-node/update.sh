#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
test -f "$ROOT/plugin.conf" || { echo "plugin.conf must be at the archive root" >&2; exit 1; }
test -f "$ROOT/runtime.mjs" || { echo "runtime.mjs is required" >&2; exit 1; }
test -f "$ROOT/titan-server-node.service" || { echo "supervisor unit is required" >&2; exit 1; }
node --check "$ROOT/runtime.mjs"
if command -v systemctl >/dev/null 2>&1 && [ "$(id -u)" -eq 0 ]; then
  systemctl daemon-reload
  systemctl try-restart titan-server-node.service || systemctl start titan-server-node.service
  systemctl is-active --quiet titan-server-node.service
fi
printf '%s\n' '{"plugin":"titan-server-node","lifecycle":"updated","rollback":"supervisor-package-snapshot"}'
