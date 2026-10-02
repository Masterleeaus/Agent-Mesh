#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
test -f "$ROOT/update.sh" && [ ! -L "$ROOT/update.sh" ] || { echo "update.sh must be a regular file" >&2; exit 1; }
# Reuse the package validation and observed process checks used for updates.
source "$ROOT/update.sh"
validate_server_node_package "$ROOT"
if command -v systemctl >/dev/null 2>&1 && [ "$(id -u)" -eq 0 ]; then
  validate_server_node_supervisor_runtime
  id titan-node >/dev/null 2>&1 || useradd --system --home-dir /var/lib/titan/server-node --shell /usr/sbin/nologin titan-node
  command -v curl >/dev/null 2>&1 || { echo "curl is required" >&2; exit 1; }
  if [ -f /usr/local/titan/server-node/runtime.mjs ]; then
    update_server_node "$ROOT" /usr/local/titan/server-node /etc/systemd/system/titan-server-node.service /usr/local/titan/server-node-backups /etc/titan/server-node.env
    exit 0
  fi
  install -d -o titan-node -g titan-node -m 0750 /var/lib/titan/server-node
  install -d -m 0755 /usr/local/titan/server-node
  install -m 0644 "$ROOT/runtime.mjs" "$ROOT/directadmin-relay.mjs" "$ROOT/package.json" "$ROOT/plugin.conf" /usr/local/titan/server-node/
  install -m 0755 "$ROOT/health.sh" /usr/local/titan/server-node/
  install -m 0644 "$ROOT/titan-server-node.service" /etc/systemd/system/titan-server-node.service
  if [ ! -f /etc/titan/server-node.env ]; then
    install -d -m 0750 /etc/titan
    umask 077
    printf 'TITAN_NODE_AUTH_TOKEN=%s\n' "$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))')" > /etc/titan/server-node.env
  fi
  systemctl daemon-reload
  systemctl enable --now titan-server-node.service
  verify_server_node_process "$(server_node_port /etc/titan/server-node.env)"
  printf '%s\n' '{"plugin":"titan-server-node","lifecycle":"installed","supervisor":"systemd","status":"live"}'
  exit 0
fi
printf '%s\n' '{"plugin":"titan-server-node","lifecycle":"validated","supervisor":"titan-server-node.service","mode":"bounded-projection"}'
