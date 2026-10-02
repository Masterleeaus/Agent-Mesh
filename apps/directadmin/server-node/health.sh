#!/usr/bin/env bash
set -euo pipefail
PORT="${TITAN_NODE_PORT:-3015}"
if ! [[ "$PORT" =~ ^[1-9][0-9]{0,4}$ ]] || (( PORT < 1 || PORT > 65535 )); then printf '%s\n' '{"plugin":"titan-server-node","status":"unavailable","reason":"invalid_port"}'; exit 2; fi
if ! command -v curl >/dev/null 2>&1 || ! command -v node >/dev/null 2>&1; then printf '%s\n' '{"plugin":"titan-server-node","status":"unavailable","reason":"required_runtime_missing"}'; exit 1; fi
if ! RESPONSE="$(curl --silent --show-error --max-time 3 "http://127.0.0.1:${PORT}/live")"; then printf '%s\n' '{"plugin":"titan-server-node","status":"unavailable","reason":"health_endpoint_unreachable"}'; exit 1; fi
printf '%s' "$RESPONSE" | node -e 'let raw=""; process.stdin.on("data", c => raw += c); process.stdin.on("end", () => { try { const body=JSON.parse(raw); if(body.service!=="titan-server-node" || body.ok!==true) throw new Error(); process.stdout.write(JSON.stringify({plugin:"titan-server-node",status:"live",service:body.service})+"\n"); } catch { process.stdout.write(JSON.stringify({plugin:"titan-server-node",status:"unavailable",reason:"invalid_health_response"})+"\n"); process.exitCode=1; } });'
