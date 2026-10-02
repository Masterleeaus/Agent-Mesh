#!/bin/sh
set -eu

INVOKED_SCRIPT="$0"
INVOKED_SCRIPT_DIR=$(dirname -- "$INVOKED_SCRIPT")
INVOKED_PLUGIN_DIR=$(dirname -- "$INVOKED_SCRIPT_DIR")
if [ -L "$INVOKED_SCRIPT" ] || [ -L "$INVOKED_SCRIPT_DIR" ] || [ -L "$INVOKED_PLUGIN_DIR" ]; then
  echo "Developer Portal update validation failed: plugin path contains a symlink" >&2
  exit 1
fi

SCRIPT_DIR=$(CDPATH= cd -- "$INVOKED_SCRIPT_DIR" && pwd)
PLUGIN_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

for rel in admin reseller user hooks lib scripts; do
  if [ ! -d "$PLUGIN_DIR/$rel" ] || [ -L "$PLUGIN_DIR/$rel" ]; then
    echo "Developer Portal update validation failed: missing or unsafe plugin directory $rel" >&2
    exit 1
  fi
done

for rel in plugin.conf admin/index.html reseller/index.html user/index.html lib/app.php hooks/admin_txt.html hooks/reseller_txt.html hooks/user_txt.html; do
  if [ ! -f "$PLUGIN_DIR/$rel" ] || [ -L "$PLUGIN_DIR/$rel" ]; then
    echo "Developer Portal update validation failed: missing or unsafe $rel" >&2
    exit 1
  fi
done

for rel in admin/index.html reseller/index.html user/index.html; do
  if [ ! -f "$PLUGIN_DIR/$rel" ] || [ -L "$PLUGIN_DIR/$rel" ] || [ ! -x "$PLUGIN_DIR/$rel" ]; then
    echo "Developer Portal update validation failed: $rel is not a regular executable file" >&2
    exit 1
  fi
done

echo "Developer Portal update validation passed; no plugin-owned state was changed"
