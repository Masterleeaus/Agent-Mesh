#!/usr/bin/env bash
set -euo pipefail
PORT="${TITAN_SERVER_NODE_PORT:-3099}"
if ! [[ "$PORT" =~ ^[0-9]{1,5}$ ]] || (( PORT < 1 || PORT > 65535 )); then
  printf "%s\n" '{"plugin":"titan-server-node","status":"unavailable","reason":"invalid_port"}'
  exit 2
fi
if ! command -v curl >/dev/null 2>&1 || ! command -v node >/dev/null 2>&1; then
  printf "%s\n" '{"plugin":"titan-server-node","status":"unavailable","reason":"required_runtime_missing"}'
  exit 1
fi
if ! RESPONSE="$(curl --silent --show-error --max-time 3 "http://127.0.0.1:${PORT}/v1/status")"; then
  printf "%s\n" '{"plugin":"titan-server-node","status":"unavailable","reason":"health_endpoint_unreachable"}'
  exit 1
fi
printf "%s" "$RESPONSE" | node -e '
let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", chunk => raw += chunk);
process.stdin.on("end", () => {
  try {
    const body = JSON.parse(raw);
    if (body.schema !== "titan.server-node.health.v1" || !Array.isArray(body.checks)) throw new Error("invalid_health_contract");
    process.stdout.write(JSON.stringify({ plugin: "titan-server-node", status: body.status, checked_at: body.checked_at, checks: body.checks }) + "\n");
    if (body.ready !== true) process.exitCode = 1;
  } catch {
    process.stdout.write(JSON.stringify({ plugin: "titan-server-node", status: "unavailable", reason: "invalid_health_response" }) + "\n");
    process.exitCode = 1;
  }
});
'