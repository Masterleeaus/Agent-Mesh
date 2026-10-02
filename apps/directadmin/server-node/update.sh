#!/usr/bin/env bash
# Bounded host adapter for the canonical package -> verify -> activate/rollback
# lifecycle. No company data, business authority, or evidence is mutated here.

validate_server_node_package() {
  local source="$1" package_kind="${2:-plugin}" file
  case "$package_kind" in plugin|runtime) ;; *) echo 'invalid Server Node package validation mode' >&2; return 1 ;; esac
  for file in plugin.conf runtime.mjs directadmin-relay.mjs package.json health.sh titan-server-node.service; do
    if [ ! -f "$source/$file" ] || [ -L "$source/$file" ]; then
      echo "package input must be a regular file: $file" >&2; return 1
    fi
  done
  if [ "$package_kind" = plugin ]; then
    for file in scripts/install.sh scripts/update.sh scripts/uninstall.sh user/index.html user/directadmin-gateway.raw images/directadmin-relay-client.mjs; do
      if [ ! -f "$source/$file" ] || [ -L "$source/$file" ]; then
        echo "package input must be a regular file: $file" >&2; return 1
      fi
    done
  fi
  command -v flock >/dev/null 2>&1 || { echo 'flock is required for durable single-writer state' >&2; return 1; }
  command -v node >/dev/null 2>&1 || { echo 'Node.js 20+ is required' >&2; return 1; }
  node -e 'if (Number(process.versions.node.split(".")[0]) < 20) process.exit(1)' || { echo 'Node.js 20+ is required' >&2; return 1; }
  node --check "$source/runtime.mjs" || return 1
  node --check "$source/directadmin-relay.mjs" || return 1
  if [ "$package_kind" = plugin ]; then node --check "$source/images/directadmin-relay-client.mjs" || return 1; fi
  bash -n "$source/health.sh" || return 1
  if [ "$package_kind" = plugin ]; then
    for file in scripts/install.sh scripts/update.sh scripts/uninstall.sh user/index.html user/directadmin-gateway.raw; do
      bash -n "$source/$file" || return 1
      [ -x "$source/$file" ] || { echo "DirectAdmin entrypoint must be executable: $file" >&2; return 1; }
    done
  fi
  node - "$source" <<'JS'
const fs = require('node:fs'), path = require('node:path'), root = process.argv[2];
const manifest = fs.readFileSync(path.join(root, 'plugin.conf'), 'utf8');
if (!/^name=titan-server-node$/m.test(manifest) || !/^version=\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/m.test(manifest)) throw Error('invalid plugin manifest');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.name !== '@titan-zero/server-node' || pkg.type !== 'module') throw Error('invalid runtime package');
const unit = fs.readFileSync(path.join(root, 'titan-server-node.service'), 'utf8');
for (const line of ['[Service]', 'ExecStart=/usr/bin/node /usr/local/titan/server-node/runtime.mjs --serve', 'ProtectSystem=strict', 'ReadWritePaths=/var/lib/titan/server-node', 'Environment=TITAN_NODE_STORE_PATH=/var/lib/titan/server-node/control.json']) {
  if (!unit.split(/\r?\n/).includes(line)) throw Error('invalid supervisor unit: ' + line);
}
JS
}

# The systemd unit has a fixed interpreter. A different Node on PATH cannot
# establish that this privileged service will start with its configured binary.
validate_server_node_supervisor_runtime() {
  local executable="${1:-/usr/bin/node}"
  [ -x "$executable" ] || { echo "supervisor Node executable missing: $executable" >&2; return 1; }
  "$executable" -e 'if (Number(process.versions.node.split(".")[0]) < 20) process.exit(1)' || { echo 'supervisor requires Node.js 20+ at its configured executable' >&2; return 1; }
}

server_node_port() {
  # Parse only the endpoint setting. Never source a root-owned secrets file as
  # shell code or include its contents in reports/backups.
  node - "$1" <<'JS'
const fs = require('node:fs');
let input = '';
try { input = fs.readFileSync(process.argv[2], 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
let port = '3015';
for (const line of input.split(/\r?\n/)) {
  if (!/^\s*TITAN_NODE_PORT\s*=/.test(line)) continue;
  const match = line.match(/^\s*TITAN_NODE_PORT\s*=\s*(?:"([0-9]+)"|'([0-9]+)'|([0-9]+))\s*$/);
  if (!match) throw Error('invalid TITAN_NODE_PORT in environment file');
  port = match[1] || match[2] || match[3];
}
if (!/^[1-9][0-9]{0,4}$/.test(port) || Number(port) > 65535) throw Error('invalid TITAN_NODE_PORT');
process.stdout.write(port);
JS
}

verify_server_node_process() {
  local port="$1" require_pid="${2:-true}" attempt pid response
  for ((attempt=0; attempt<15; attempt++)); do
    if systemctl is-active --quiet titan-server-node.service &&
       pid="$(systemctl show --property MainPID --value titan-server-node.service)" &&
       [[ "$pid" =~ ^[1-9][0-9]*$ ]] &&
       response="$(curl --fail --silent --show-error --max-time 2 "http://127.0.0.1:$port/live" 2>/dev/null)" &&
       printf '%s' "$response" | node -e '
let raw=""; process.stdin.on("data", part => raw+=part); process.stdin.on("end", () => {
  try { const body=JSON.parse(raw); if (body.ok!==true || body.service!=="titan-server-node" ||
    (body.pid!==Number(process.argv[1]) && !(process.argv[2]==="false" && body.pid===undefined))) throw Error(); }
  catch { process.exitCode=1; }
});' "$pid" "$require_pid"; then
      return 0
    fi
    sleep 1
  done
  echo 'restarted Server Node did not pass process liveness verification' >&2
  return 1
}

server_node_update_report() {
  node - "$@" <<'JS'
const [lifecycle, status, artifact] = process.argv.slice(2);
process.stdout.write(JSON.stringify({ plugin:'titan-server-node', lifecycle,
  ...(lifecycle === 'updated' ? {status} : {rollback:status}), rollback_artifact:artifact }) + '\n');
JS
}

# Paths are explicit so this host operation can be exercised using disposable
# filesystem fixtures. The CLI below always uses the fixed production paths.
update_server_node() (
  set -Eeuo pipefail
  local source="$1" installed="$2" unit="$3" backups="$4" config="$5"
  local stage='' unit_stage='' backup='' promoted=false port file
  validate_server_node_package "$source"
  for file in "$installed" "$unit" "$backups"; do
    [ ! -L "$file" ] || { echo "refusing symlink deployment target: $file" >&2; exit 1; }
  done
  [ -d "$installed" ] && [ -f "$installed/runtime.mjs" ] && [ -f "$unit" ] || { echo 'existing installation required; run install.sh first' >&2; exit 1; }
  command -v curl >/dev/null && command -v flock >/dev/null
  port="$(server_node_port "$config")"
  exec 9>"${installed}.update.lock"
  flock -n 9 || { echo 'another Server Node update is in progress' >&2; exit 1; }
  trap '[ -z "$stage" ] || rm -rf -- "$stage"; [ -z "$unit_stage" ] || rm -f -- "$unit_stage"' EXIT
  stage="$(mktemp -d "${installed}.stage.XXXXXX")"
  chmod 0755 "$stage"
  for file in runtime.mjs directadmin-relay.mjs package.json plugin.conf; do install -m 0644 "$source/$file" "$stage/$file"; done
  install -m 0755 "$source/health.sh" "$stage/health.sh"
  install -m 0644 "$source/titan-server-node.service" "$stage/titan-server-node.service"
  validate_server_node_package "$stage" runtime
  unit_stage="$(mktemp "${unit}.stage.XXXXXX")"
  install -m 0644 "$stage/titan-server-node.service" "$unit_stage"
  install -d -m 0700 "$backups"
  backup="$(mktemp -d "$backups/release.XXXXXX")"
  cp -a "$installed" "$backup/runtime"
  cp -p "$unit" "$backup/titan-server-node.service"
  backup_hash_files=(runtime/runtime.mjs runtime/package.json titan-server-node.service)
  if [ -f "$backup/runtime/directadmin-relay.mjs" ]; then backup_hash_files+=(runtime/directadmin-relay.mjs); fi
  (cd "$backup"; sha256sum "${backup_hash_files[@]}" > SHA256SUMS)
  (cd "$stage"; sha256sum runtime.mjs directadmin-relay.mjs package.json plugin.conf health.sh titan-server-node.service > SHA256SUMS)

  rollback_update() {
    local original_status="$1" restored=true
    trap - ERR INT TERM
    set +e
    echo "Server Node update failed; rollback artifact: $backup" >&2
    if [ "$promoted" = true ]; then
      systemctl stop titan-server-node.service || restored=false
      if [ -d "$backup/displaced-runtime" ]; then
        if [ -d "$installed" ]; then mv -T -- "$installed" "$backup/failed-runtime" || restored=false; fi
        mv -T -- "$backup/displaced-runtime" "$installed" || restored=false
      fi
      cp -p "$backup/titan-server-node.service" "$unit" || restored=false
      systemctl daemon-reload || restored=false
      systemctl restart titan-server-node.service || restored=false
      verify_server_node_process "$port" false || restored=false
    fi
    if [ "$restored" = true ]; then server_node_update_report update-failed restored "$backup";
    else server_node_update_report update-failed failed "$backup"; fi
    exit "$original_status"
  }
  trap 'rollback_update $?' ERR
  trap 'rollback_update 130' INT
  trap 'rollback_update 143' TERM
  # Quiesce the old process before replacing its code. Snapshot and validation
  # are already complete; every subsequent failure restores the prior artifact.
  promoted=true
  systemctl stop titan-server-node.service
  mv -T -- "$installed" "$backup/displaced-runtime"
  mv -T -- "$stage" "$installed"
  stage=''
  mv -T -- "$unit_stage" "$unit"
  unit_stage=''
  (trap - ERR INT TERM; cd "$installed"; sha256sum --check --status SHA256SUMS)
  cmp "$installed/titan-server-node.service" "$unit"
  systemctl daemon-reload
  systemctl restart titan-server-node.service
  verify_server_node_process "$port"
  server_node_update_report updated live "$backup"
  trap - ERR INT TERM
  rm -rf -- "$backup/displaced-runtime"
)

main() {
  set -euo pipefail
  local root
  root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  validate_server_node_package "$root"
  if command -v systemctl >/dev/null 2>&1 && [ "$(id -u)" -eq 0 ]; then
    validate_server_node_supervisor_runtime
    update_server_node "$root" /usr/local/titan/server-node /etc/systemd/system/titan-server-node.service /usr/local/titan/server-node-backups /etc/titan/server-node.env
  else
    printf '%s\n' '{"plugin":"titan-server-node","lifecycle":"validated","mode":"bounded-projection","updated":false}'
  fi
}
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then main "$@"; fi
