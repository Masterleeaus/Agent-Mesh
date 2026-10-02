#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PLUGIN_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

for rel in plugin.conf admin/index.html reseller/index.html user/index.html lib/app.php hooks/admin_txt.html hooks/reseller_txt.html hooks/user_txt.html; do
  if [ ! -f "$PLUGIN_DIR/$rel" ]; then
    echo "Titan Dev Access update validation failed: missing $rel" >&2
    exit 1
  fi
done

for rel in admin/index.html reseller/index.html user/index.html; do
  if [ ! -x "$PLUGIN_DIR/$rel" ]; then
    echo "Titan Dev Access update validation failed: $rel is not executable" >&2
    exit 1
  fi
done

echo "Titan Dev Access update validation passed; plugin-owned state is preserved"
