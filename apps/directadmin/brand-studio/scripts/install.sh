#!/bin/sh
set -eu
node_major=$(node -p 'Number(process.versions.node.split(".")[0])')
[ "$node_major" -ge 22 ] || { echo 'Titan Web requires Node.js 22 or later.' >&2; exit 1; }
[ -f "$(dirname "$0")/../plugin.conf" ] || { echo 'Titan Web package files are incomplete.' >&2; exit 1; }
echo 'Prerequisites verified. Activate this package with DirectAdmin Plugin Manager; no customer data was changed.'
