#!/bin/sh
set -eu
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PLUGIN_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
command -v node >/dev/null 2>&1 || { echo 'Titan Web requires Node.js 22 or newer.' >&2; exit 1; }
node -e 'if (Number(process.versions.node.split(".")[0]) < 22) { console.error("Titan Web requires Node.js 22 or newer."); process.exit(1); }'
for rel in admin reseller user hooks scripts lib images; do
  if [ ! -d "$PLUGIN_DIR/$rel" ] || [ -L "$PLUGIN_DIR/$rel" ]; then echo "Titan Web preflight failed: missing or unsafe directory $rel" >&2; exit 1; fi
done
for rel in AGENTS.md README.md plugin.conf admin/index.html reseller/index.html user/index.html hooks/admin_txt.html hooks/reseller_txt.html hooks/user_txt.html scripts/install.sh scripts/update.sh scripts/uninstall.sh lib/entry.mjs images/cockpit.mjs images/sdk.mjs images/style.css; do
  if [ ! -f "$PLUGIN_DIR/$rel" ] || [ -L "$PLUGIN_DIR/$rel" ]; then echo "Titan Web preflight failed: missing or unsafe $rel" >&2; exit 1; fi
done
for rel in admin/index.html reseller/index.html user/index.html scripts/install.sh scripts/update.sh scripts/uninstall.sh; do
  [ -x "$PLUGIN_DIR/$rel" ] || { echo "Titan Web preflight failed: $rel must be executable" >&2; exit 1; }
done
echo 'Titan Web package preflight passed. Apply only through DirectAdmin Plugin Manager; no business state was changed.'

