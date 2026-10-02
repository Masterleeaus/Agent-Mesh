#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHIVE="${1:-$ROOT/dist/titan_dev_access.tar.gz}"
PLUGIN_ID="titan_dev_access"

fail(){ echo "Developer Portal Plugin Lab: FAIL: $*" >&2; exit 1; }
pass(){ echo "Developer Portal Plugin Lab: PASS: $*"; }

[[ -f "$ROOT/plugin.conf" ]] || fail "missing source plugin.conf"
grep -q '^name=Developer Portal$' "$ROOT/plugin.conf" || fail "unexpected display name"
grep -Eq '^version=[0-9]+\.[0-9]+\.[0-9]+([-.+][0-9A-Za-z.-]+)?$' "$ROOT/plugin.conf" || fail "invalid semantic version"

for rel in admin/index.html reseller/index.html user/index.html scripts/install.sh scripts/uninstall.sh lib/app.php; do
  [[ -f "$ROOT/$rel" ]] || fail "missing source file $rel"
done

for hook in "$ROOT"/hooks/*_txt.html; do
  [[ -f "$hook" ]] || fail "missing hook files"
  if grep -Eq '/evo/|/evo/plugin' "$hook"; then fail "hook contains forbidden Evolution frontend route: $hook"; fi
  grep -Eq "/CMD_PLUGINS(_ADMIN|_RESELLER)?/$PLUGIN_ID|/CMD_PLUGINS/$PLUGIN_ID" "$hook" || fail "hook does not target stable plugin id: $hook"
done

php -l "$ROOT/lib/app.php" >/dev/null || fail "PHP syntax"
for f in "$ROOT"/admin/index.html "$ROOT"/reseller/index.html "$ROOT"/user/index.html; do php -l "$f" >/dev/null || fail "PHP syntax: $f"; done
for f in "$ROOT"/scripts/*.sh "$ROOT"/tools/*.sh; do bash -n "$f" || fail "shell syntax: $f"; done

if grep -RIlE --exclude-dir=dist --exclude='*.md' '-----BEGIN [A-Z ]*PRIVATE KEY-----' "$ROOT" >/dev/null 2>&1; then fail "private-key block found in plugin source"; fi

[[ -f "$ARCHIVE" ]] || fail "archive missing: $ARCHIVE"
[[ "$(basename "$ARCHIVE")" == "$PLUGIN_ID.tar.gz" ]] || fail "archive filename must be $PLUGIN_ID.tar.gz"

mapfile -t entries < <(tar -tzf "$ARCHIVE" | sed 's#^\./##' | sed '/^$/d')
(( ${#entries[@]} > 0 )) || fail "archive is empty"
for required in plugin.conf admin/index.html reseller/index.html user/index.html hooks/admin_txt.html hooks/reseller_txt.html hooks/user_txt.html lib/app.php scripts/install.sh scripts/uninstall.sh; do
  printf '%s\n' "${entries[@]}" | grep -Fxq "$required" || fail "archive missing $required"
done
if printf '%s\n' "${entries[@]}" | grep -Eq '^[^/]+/(plugin\.conf|admin/index\.html)$'; then fail "archive contains an enclosing package directory"; fi
if printf '%s\n' "${entries[@]}" | grep -Eq '(^|/)\.\.?(/|$)'; then fail "archive contains unsafe path entry"; fi

VERIFY="$(mktemp -d)"
trap 'rm -rf "$VERIFY"' EXIT
tar -xzf "$ARCHIVE" -C "$VERIFY"

for rel in admin/index.html reseller/index.html user/index.html scripts/install.sh scripts/uninstall.sh; do [[ -x "$VERIFY/$rel" ]] || fail "archive executable mode missing: $rel"; done
[[ ! -L "$VERIFY/plugin.conf" ]] || fail "plugin.conf must not be a symlink"
[[ -f "$VERIFY/plugin.conf" ]] || fail "plugin.conf must be a regular file"
php -l "$VERIFY/lib/app.php" >/dev/null || fail "packaged PHP syntax"
for f in "$VERIFY"/admin/index.html "$VERIFY"/reseller/index.html "$VERIFY"/user/index.html; do php -l "$f" >/dev/null || fail "packaged entrypoint syntax"; done
for f in "$VERIFY"/scripts/*.sh; do bash -n "$f" || fail "packaged shell syntax"; done

pass "source layout, routing, syntax, archive root, modes and secret scan"
