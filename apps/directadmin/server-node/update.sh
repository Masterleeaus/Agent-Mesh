#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
test -f "$ROOT/plugin.conf" || { echo "plugin.conf must be at the archive root" >&2; exit 1; }
printf '%s\n' '{"plugin":"titan-server-node","lifecycle":"updated","rollback":"previous-known-good"}'

