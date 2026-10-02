# LEGACY SHARED-POSTGRES COMPATIBILITY MIGRATOR.
# The mature db/migrations lineage remains critical native FSM schema/behavior
# evidence, but this script applies it to one PostgreSQL database and is not the
# target database-per-company provisioning path. Preserve it for existing
# installations and migration extraction until #809/#648 certify the portable
# COMPANY_NATIVE_FSM manifest and explicit cutover.

#!/usr/bin/env bash
set -euo pipefail

# Runtime DATABASE_URL can be restricted; use separate admin credentials for DDL.
DATABASE_URL="${MIGRATION_DATABASE_URL:-${DATABASE_URL:-}}"
if [[ -z "${DATABASE_URL}" ]]; then
  echo "MIGRATION_DATABASE_URL (or DATABASE_URL for existing setups) is required"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MIGRATIONS_DIR="${REPO_ROOT}/db/migrations"

# Validate the immutable list before connecting to or changing a database.
# The tab-separated output preserves the explicit order and expected checksum.
MIGRATION_MANIFEST="$(node "${SCRIPT_DIR}/check-migration-prefixes.mjs" --list)"
if [[ -z "${MIGRATION_MANIFEST}" ]]; then
  echo "migration manifest is empty; refusing to run" >&2
  exit 1
fi

psql_cmd() {
  if command -v psql >/dev/null 2>&1; then
    psql "$DATABASE_URL" "$@"
    return
  fi

  if ! command -v docker >/dev/null 2>&1; then
    echo "psql is required (or install Docker so this script can use postgres:16 as a psql client)" >&2
    exit 1
  fi

  docker run --rm --network host -v "${REPO_ROOT}:${REPO_ROOT}" -w "${REPO_ROOT}" postgres:16 \
    psql "$DATABASE_URL" "$@"
}

# Ensure migration tracking table exists
psql_cmd -v ON_ERROR_STOP=1 -c "
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename   TEXT PRIMARY KEY,
    checksum   TEXT,
    applied_at TIMESTAMPTZ DEFAULT now()
  )
"
# Older installs have filename-only rows. Leave their checksum NULL rather than
# pretending the historical file bytes were recorded at application time.
psql_cmd -v ON_ERROR_STOP=1 -c "ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS checksum TEXT"

declare -A EXPECTED_CHECKSUMS=()
declare -A APPLIED_FILES=()
declare -A APPLIED_CHECKSUMS=()
while IFS=$'\t' read -r filename expected_checksum; do
  [[ -n "${filename}" ]] || continue
  EXPECTED_CHECKSUMS["${filename}"]="${expected_checksum}"
done <<< "${MIGRATION_MANIFEST}"

# Validate every recorded checksum before applying any pending migration.
# Filename-only rows are retained as legacy-unverified, never backfilled with
# a checksum that the old ledger did not capture.
APPLIED_ROWS="$(psql_cmd -tA -F $'\t' -c "SELECT filename || E'\\t' || COALESCE(checksum, '') FROM schema_migrations ORDER BY filename")"
while IFS=$'\t' read -r applied_filename applied_checksum; do
  [[ -n "${applied_filename}" ]] || continue
  expected_checksum="${EXPECTED_CHECKSUMS[${applied_filename}]:-}"
  if [[ -z "${expected_checksum}" ]]; then
    echo "database history contains a migration absent from the immutable manifest: ${applied_filename}" >&2
    exit 1
  fi
  if [[ -n "${applied_checksum}" && "${applied_checksum}" != "${expected_checksum}" ]]; then
    echo "applied migration checksum differs from the immutable manifest: ${applied_filename}" >&2
    exit 1
  fi
  APPLIED_FILES["${applied_filename}"]=1
  APPLIED_CHECKSUMS["${applied_filename}"]="${applied_checksum}"
done <<< "${APPLIED_ROWS}"

# Detect transition case: existing schema with no tracking history
MIGRATE_MODE="$(psql_cmd -tAc "
  SELECT CASE
    WHEN (SELECT COUNT(*) FROM schema_migrations) = 0
         AND EXISTS (
           SELECT 1 FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name = 'clients'
         )
    THEN 'seed'
    ELSE 'migrate'
  END
" 2>/dev/null | tr -d '[:space:]' || echo 'migrate')"

echo "migration mode: ${MIGRATE_MODE}"

while IFS=$'\t' read -r filename expected_checksum; do
  [[ -n "${filename}" ]] || continue
  file="${MIGRATIONS_DIR}/${filename}"

  if [[ "${MIGRATE_MODE}" == "seed" ]]; then
    echo "seeding legacy filename-only history (checksum unverified): $filename"
    psql_cmd -c "INSERT INTO schema_migrations (filename, checksum) VALUES ('$filename', NULL) ON CONFLICT DO NOTHING"
    continue
  fi

  if [[ -n "${APPLIED_FILES[${filename}]:-}" ]]; then
    if [[ -n "${APPLIED_CHECKSUMS[${filename}]:-}" ]]; then
      echo "skipping (applied filename and checksum verified): $filename"
    else
      echo "skipping (legacy filename-only record; checksum unverified): $filename"
    fi
    continue
  fi

  echo "applying migration: $filename"
  psql_cmd -v ON_ERROR_STOP=1 -f "$file"
  psql_cmd -c "INSERT INTO schema_migrations (filename, checksum) VALUES ('$filename', '$expected_checksum')"
done <<< "${MIGRATION_MANIFEST}"

echo "migrations complete"
