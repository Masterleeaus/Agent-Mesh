#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

INSTALL_ROOT="${TITAN_ZERO_INSTALL_ROOT-/opt/titan-zero}"

log(){ printf '[Titan Zero] %s\n' "$*"; }
die(){ printf '[Titan Zero] ERROR: %s\n' "$*" >&2; exit 1; }
usage(){
  cat <<'EOF'
Usage: remove-workforce-service.sh [--install-root PATH]

Stop and remove only the Workforce Compose service container. Runtime and
company data, identity/configuration files, images, and volumes are retained.
EOF
}

while (($#)); do
  case "$1" in
    --install-root)
      (($# >= 2)) || die '--install-root requires a path.'
      [[ -n "$2" ]] || die '--install-root cannot be empty.'
      INSTALL_ROOT="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *) die "Unknown argument: $1";;
  esac
done

[[ "$INSTALL_ROOT" == /* && "$INSTALL_ROOT" != / ]] \
  || die 'Install root must be an absolute path other than /.'
command -v docker >/dev/null 2>&1 || die 'Docker is required.'

COMPOSE="${INSTALL_ROOT%/}/current/infra/compose.vps.yml"
ENV_FILE="${INSTALL_ROOT%/}/shared/env/.env"
[[ -f "$COMPOSE" ]] || die "Compose file not found: $COMPOSE"
[[ -f "$ENV_FILE" ]] || die "Environment file not found: $ENV_FILE"

# These install-root paths are required by infra/compose.vps.yml for Compose
# interpolation; --env-file alone does not define them.
export TZ_ENV_FILE="$ENV_FILE"
export TZ_DATA_ROOT="${INSTALL_ROOT%/}/shared/data"

compose=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE")
if ! CONTAINERS="$("${compose[@]}" ps --all --quiet workforce)"; then
  die 'Could not inspect the Workforce Compose service; no removal was attempted.'
fi
if [[ -z "$CONTAINERS" ]]; then
  log 'Workforce service is already absent; nothing to remove.'
  exit 0
fi

# Compose rm without --volumes or --rmi removes only this service's containers.
# The explicit service target keeps the web, worker, Redis, and shared state up.
"${compose[@]}" rm --stop --force workforce
log 'Removed the Workforce service container; shared state and images were retained.'
