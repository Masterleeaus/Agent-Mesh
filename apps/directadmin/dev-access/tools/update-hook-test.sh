#!/usr/bin/env bash
set -euo pipefail

SOURCE_ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fail(){ echo "Developer Portal update-hook test: FAIL: $*" >&2; exit 1; }
pass(){ echo "Developer Portal update-hook test: PASS: $*"; }

for rel in plugin.conf admin reseller user hooks lib scripts; do
  if [ -L "$SOURCE_ROOT/$rel" ] || find "$SOURCE_ROOT/$rel" ! -type f ! -type d -print -quit | grep -q .; then
    fail "unsafe source input before fixture copy: $rel"
  fi
done

fixture(){
  local target="$1"
  mkdir -p "$target"
  for rel in plugin.conf admin reseller user hooks lib scripts; do
    cp -a "$SOURCE_ROOT/$rel" "$target/"
  done
  chmod 0755 "$target/admin/index.html" "$target/reseller/index.html" "$target/user/index.html" "$target/scripts/update.sh"
}

snapshot(){
  local root="$1"
  (cd "$root" && find . -mindepth 1 -printf '%y %m %u %g %p -> %l\n' | LC_ALL=C sort && find . -type f -exec sha256sum {} + | LC_ALL=C sort)
}

GOOD="$TMP/good"
fixture "$GOOD"
before="$(snapshot "$GOOD")"
"$GOOD/scripts/update.sh" >"$TMP/good.out" 2>"$TMP/good.err" || fail "valid plugin tree was rejected"
grep -Fq 'no plugin-owned state was changed' "$TMP/good.out" || fail "success message missing"
after="$(snapshot "$GOOD")"
[[ "$before" == "$after" ]] || fail "read-only validator changed files or modes"

MISSING="$TMP/missing"
fixture "$MISSING"
rm "$MISSING/hooks/admin_txt.html"
if "$MISSING/scripts/update.sh" >"$TMP/missing.out" 2>"$TMP/missing.err"; then fail "missing hook was accepted"; fi
grep -Fq 'missing or unsafe hooks/admin_txt.html' "$TMP/missing.err" || fail "missing-hook failure was not specific"

NONEXEC="$TMP/nonexec"
fixture "$NONEXEC"
chmod 0644 "$NONEXEC/reseller/index.html"
if "$NONEXEC/scripts/update.sh" >"$TMP/nonexec.out" 2>"$TMP/nonexec.err"; then fail "non-executable role entrypoint was accepted"; fi
grep -Fq 'reseller/index.html is not a regular executable file' "$TMP/nonexec.err" || fail "mode failure was not specific"

SYMLINK="$TMP/symlink"
fixture "$SYMLINK"
mv "$SYMLINK/lib/app.php" "$SYMLINK/lib/app.php.saved"
ln -s app.php.saved "$SYMLINK/lib/app.php"
if "$SYMLINK/scripts/update.sh" >"$TMP/symlink.out" 2>"$TMP/symlink.err"; then fail "symlinked required file was accepted"; fi
grep -Fq 'missing or unsafe lib/app.php' "$TMP/symlink.err" || fail "symlink failure was not specific"

PARENT_SYMLINK="$TMP/parent-symlink"
fixture "$PARENT_SYMLINK"
mv "$PARENT_SYMLINK/lib" "$PARENT_SYMLINK/lib.real"
ln -s lib.real "$PARENT_SYMLINK/lib"
if "$PARENT_SYMLINK/scripts/update.sh" >"$TMP/parent-symlink.out" 2>"$TMP/parent-symlink.err"; then fail "symlinked parent directory was accepted"; fi
grep -Fq 'missing or unsafe plugin directory lib' "$TMP/parent-symlink.err" || fail "parent-directory failure was not specific"

SCRIPT_DIR_SYMLINK="$TMP/script-dir-symlink"
fixture "$SCRIPT_DIR_SYMLINK"
mv "$SCRIPT_DIR_SYMLINK/scripts" "$SCRIPT_DIR_SYMLINK/scripts.real"
ln -s scripts.real "$SCRIPT_DIR_SYMLINK/scripts"
if "$SCRIPT_DIR_SYMLINK/scripts/update.sh" >"$TMP/script-dir-symlink.out" 2>"$TMP/script-dir-symlink.err"; then fail "symlinked script directory was accepted"; fi
grep -Fq 'plugin path contains a symlink' "$TMP/script-dir-symlink.err" || fail "script-directory failure was not specific"

pass "success is read-only; missing files, leaf/parent symlinks and non-executable files fail closed"
