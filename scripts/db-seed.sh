#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

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

# The integration harness runs against a disposable, loopback-only database
# with this exact name and user. Seed its authenticated test identities only
# after the generic development users exist; never add these memberships to a
# remote database, even if it happens to use the same database name.
seed_integration_memberships=false
if node --input-type=module - "$DATABASE_URL" <<'NODE'
let url;
try {
  url = new URL(process.argv[2]);
} catch {
  process.exit(1);
}

const database = decodeURIComponent(url.pathname.slice(1));
const username = decodeURIComponent(url.username);
const isTestTarget = database === "ai_fsm_test" || username === "ai_fsm_test";
if (!isTestTarget) process.exit(1);

const isLoopback = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
if (database !== "ai_fsm_test" || username !== "ai_fsm_test" || !isLoopback) {
  process.exit(2);
}
NODE
then
  seed_integration_memberships=true
else
  seed_target_status=$?
  if [[ "$seed_target_status" == "2" ]]; then
    echo "Refusing integration memberships outside loopback ai_fsm_test" >&2
    exit 1
  fi
fi

psql_cmd -v ON_ERROR_STOP=1 -f db/migrations/002_seed_dev.sql
psql_cmd -v ON_ERROR_STOP=1 -f db/seeds/price_book_enriched.sql

if [[ "$seed_integration_memberships" == "true" ]]; then
  psql_cmd -v ON_ERROR_STOP=1 -f db/seeds/integration_business_memberships.sql
fi

echo "seed complete"
