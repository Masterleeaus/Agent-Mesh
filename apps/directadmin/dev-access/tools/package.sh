#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="${TDA_PACKAGE_DIST:-$ROOT/dist}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$DIST"

for item in plugin.conf README.md AGENTS.md admin reseller user hooks lib scripts; do
  if [ -L "$ROOT/$item" ] || find "$ROOT/$item" ! -type f ! -type d -print -quit | grep -q .; then
    echo "Developer Portal package failed: symlink or special source entry is not allowed: $item" >&2
    exit 1
  fi
done

php -l "$ROOT/lib/app.php" >/dev/null
php -l "$ROOT/tools/request-integration-test.php" >/dev/null
php "$ROOT/tools/security-test.php"

for item in plugin.conf README.md AGENTS.md admin reseller user hooks lib scripts; do
  cp -a "$ROOT/$item" "$TMP/"
done

chmod 0755 \
  "$TMP/admin/index.html" \
  "$TMP/reseller/index.html" \
  "$TMP/user/index.html" \
  "$TMP/scripts/install.sh" \
  "$TMP/scripts/update.sh" \
  "$TMP/scripts/uninstall.sh"

chmod 0644 "$TMP/plugin.conf"
find "$TMP/hooks" "$TMP/lib" -type f -exec chmod 0644 {} +
find "$TMP" -type d -exec chmod 0755 {} +

ARCHIVE="$DIST/titan_dev_access.tar.gz"
rm -f "$ARCHIVE"
tar -C "$TMP" -czf "$ARCHIVE" .

bash "$ROOT/tools/plugin-lab.sh" "$ARCHIVE"

# Validate archive root and required files.
tar -tzf "$ARCHIVE" | sed 's#^\./##' | grep -qx 'plugin.conf'
for rel in admin/index.html reseller/index.html user/index.html scripts/install.sh scripts/update.sh scripts/uninstall.sh; do
  tar -tzf "$ARCHIVE" | sed 's#^\./##' | grep -qx "$rel"
done

VERIFY="$(mktemp -d)"
trap 'rm -rf "$TMP" "$VERIFY"' EXIT
tar -xzf "$ARCHIVE" -C "$VERIFY"

php_files=$(find "$VERIFY" \( -type f -name '*.php' -o -path '*/index.html' \))
while IFS= read -r f; do
  [ -z "$f" ] || php -l "$f" >/dev/null
done <<EOF
$php_files
EOF

for f in "$VERIFY"/scripts/*.sh; do
  bash -n "$f"
done

php "$ROOT/tools/request-integration-test.php" "$VERIFY"

test -x "$VERIFY/admin/index.html"
test -x "$VERIFY/reseller/index.html"
test -x "$VERIFY/user/index.html"
test -x "$VERIFY/scripts/install.sh"
test -x "$VERIFY/scripts/update.sh"
test -x "$VERIFY/scripts/uninstall.sh"
bash "$ROOT/tools/update-hook-test.sh" "$VERIFY"

echo "Built and validated: $ARCHIVE"
