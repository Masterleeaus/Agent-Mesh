#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
test -f "$ROOT/plugin.conf" || { echo "plugin.conf must be at the archive root" >&2; exit 1; }
test -f "$ROOT/health.sh" || { echo "health.sh is required" >&2; exit 1; }
test -f "$ROOT/runtime.mjs" || { echo "runtime.mjs is required" >&2; exit 1; }
test -f "$ROOT/titan-server-node.service" || { echo "supervisor unit is required" >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js 20+ is required" >&2; exit 1; }
NODE_MAJOR="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
test "$NODE_MAJOR" -ge 20 || { echo "Node.js 20+ is required" >&2; exit 1; }
if command -v systemctl >/dev/null 2>&1 && [ "$(id -u)" -eq 0 ]; then
  id titan-node >/dev/null 2>&1 || useradd --system --home-dir /var/lib/titan/server-node --shell /usr/sbin/nologin titan-node
  install -d -o titan-node -g titan-node -m 0750 /var/lib/titan/server-node /usr/local/titan/server-node
  install -m 0644 "$ROOT/runtime.mjs" "$ROOT/package.json" /usr/local/titan/server-node/
  install -m 0644 "$ROOT/titan-server-node.service" /etc/systemd/system/titan-server-node.service
  if [ ! -f /etc/titan/server-node.env ]; then
    install -d -m 0750 /etc/titan
    umask 077
    printf 'TITAN_NODE_AUTH_TOKEN=%s\n' "$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))')" > /etc/titan/server-node.env
  fi
  systemctl daemon-reload
  systemctl enable --now titan-server-node.service
  systemctl is-active --quiet titan-server-node.service
  printf '%s\n' '{"plugin":"titan-server-node","lifecycle":"installed","supervisor":"systemd","status":"active"}'
  exit 0
fi
printf '%s\n' '{"plugin":"titan-server-node","lifecycle":"validated","supervisor":"titan-server-node.service","mode":"bounded-projection"}'
