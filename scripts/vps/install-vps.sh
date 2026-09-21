#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

INSTALLER_VERSION="1.0.0-recovery-successor-tls6-redis7"
INSTALL_ROOT="/opt/titan-zero"
APP_PORT="3000"
SOURCE=""
APP_DOMAIN="${APP_DOMAIN:-}"
DOMAIN="" # deprecated CLI compatibility alias; canonical value is APP_DOMAIN
EMAIL=""
NO_TLS=0
NON_INTERACTIVE=0
KEEP_WORK=0

log()  { printf '\033[1;36m[Titan Zero]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warning]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<USAGE
Titan Zero VPS Installer ${INSTALLER_VERSION}

Usage:
  sudo bash Titan-Zero-VPS-Installer-Pass01.sh --source <zip-or-url> [options]

Required:
  --source PATH|URL       Titan Zero application ZIP, local path or HTTPS URL.

Options:
  --domain DOMAIN         Backward-compatible alias for APP_DOMAIN.
  --app-domain DOMAIN     Canonical public DNS name, e.g. app.example.com.
  --email EMAIL           Email for Let's Encrypt. Requires --domain.
  --install-root PATH     Install root. Default: /opt/titan-zero
  --app-port PORT         Local app port. Default: 3000
  --no-tls                Configure Caddy for HTTP only; disable automatic HTTPS.
  --non-interactive       Fail instead of prompting for missing required data.
  --keep-work             Keep temporary extraction directory for diagnostics.
  -h, --help              Show this help.

Examples:
  sudo bash Titan-Zero-VPS-Installer-Pass01.sh \\
    --source /root/Titan-Zero.zip \\
    --domain titan.example.com \\
    --email admin@example.com

  sudo bash Titan-Zero-VPS-Installer-Pass01.sh \\
    --source https://example.com/Titan-Zero.zip \\
    --no-tls
USAGE
}

while (($#)); do
  case "$1" in
    --source) [[ $# -ge 2 ]] || die "--source requires a value"; SOURCE="$2"; shift 2 ;;
    --domain) [[ $# -ge 2 ]] || die "--domain requires a value"; DOMAIN="$2"; APP_DOMAIN="$2"; shift 2 ;;
    --app-domain) [[ $# -ge 2 ]] || die "--app-domain requires a value"; APP_DOMAIN="$2"; shift 2 ;;
    --email) [[ $# -ge 2 ]] || die "--email requires a value"; EMAIL="$2"; shift 2 ;;
    --install-root) [[ $# -ge 2 ]] || die "--install-root requires a value"; INSTALL_ROOT="$2"; shift 2 ;;
    --app-port) [[ $# -ge 2 ]] || die "--app-port requires a value"; APP_PORT="$2"; shift 2 ;;
    --no-tls) NO_TLS=1; shift ;;
    --non-interactive) NON_INTERACTIVE=1; shift ;;
    --keep-work) KEEP_WORK=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "Unknown argument: $1" ;;
  esac
done

[[ ${EUID} -eq 0 ]] || die "Run this installer as root (sudo)."
[[ -n "$SOURCE" ]] || { usage; die "--source is required"; }
[[ "$APP_PORT" =~ ^[0-9]+$ ]] || die "--app-port must be numeric"
(( APP_PORT >= 1 && APP_PORT <= 65535 )) || die "--app-port must be between 1 and 65535"
[[ "$INSTALL_ROOT" = /* ]] || die "--install-root must be an absolute path"
[[ -z "$EMAIL" || "$EMAIL" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]] || die "Invalid email"

normalize_app_domain() {
  local raw="${1:-}"
  raw="$(printf '%s' "$raw" | tr '[:upper:]' '[:lower:]' | xargs)"
  [[ -z "$raw" ]] && { printf ''; return 0; }
  [[ "$raw" != *'://'* ]] || return 1
  [[ "$raw" != */* ]] || return 1
  [[ "$raw" != *:* ]] || return 1
  [[ "$raw" != *'@'* ]] || return 1
  [[ "$raw" != *'*'* ]] || return 1
  [[ ${#raw} -le 253 ]] || return 1
  [[ "$raw" != .* && "$raw" != *. && "$raw" != *..* ]] || return 1
  local label
  IFS='.' read -r -a labels <<< "$raw"
  ((${#labels[@]} >= 2)) || return 1
  for label in "${labels[@]}"; do
    [[ -n "$label" && ${#label} -le 63 ]] || return 1
    [[ "$label" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]] || return 1
  done
  [[ "${labels[-1]}" =~ [a-z] ]] || return 1
  printf '%s' "$raw"
}

if [[ -n "$APP_DOMAIN" ]]; then
  APP_DOMAIN="$(normalize_app_domain "$APP_DOMAIN")" || die "Invalid APP_DOMAIN: provide a DNS hostname only (no scheme, path, port, wildcard, or userinfo)"
fi
DOMAIN="$APP_DOMAIN"

if [[ -n "$EMAIL" && -z "$APP_DOMAIN" ]]; then
  die "--email requires --app-domain/--domain or APP_DOMAIN"
fi

if [[ -n "$APP_DOMAIN" && $NO_TLS -eq 0 && -z "$EMAIL" ]]; then
  if [[ $NON_INTERACTIVE -eq 1 ]]; then
    die "--email is required for automatic TLS when --non-interactive is used"
  fi
  read -r -p "Let's Encrypt email for ${APP_DOMAIN}: " EMAIL
  [[ "$EMAIL" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]] || die "Invalid email"
fi

if ! command -v apt-get >/dev/null 2>&1; then
  die "Pass 01 supports Debian/Ubuntu VPS hosts using apt."
fi

. /etc/os-release || true
case "${ID:-}" in
  ubuntu|debian) ;;
  *) warn "Host reports ID=${ID:-unknown}; continuing because apt is available." ;;
esac

WORK_DIR="$(mktemp -d /tmp/titan-zero-install.XXXXXX)"
ZIP_PATH="${WORK_DIR}/titan-zero.zip"
EXTRACT_DIR="${WORK_DIR}/extract"
RELEASES_DIR="${INSTALL_ROOT}/releases"
CURRENT_LINK="${INSTALL_ROOT}/current"
SHARED_DIR="${INSTALL_ROOT}/shared"
ENV_DIR="${SHARED_DIR}/env"
DATA_DIR="${SHARED_DIR}/data"
BACKUP_DIR="${INSTALL_ROOT}/backups"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RELEASE_DIR="${RELEASES_DIR}/${TIMESTAMP}"

cleanup() {
  if [[ $KEEP_WORK -eq 0 ]]; then
    rm -rf "$WORK_DIR"
  else
    warn "Temporary working directory retained: $WORK_DIR"
  fi
}
trap cleanup EXIT
trap 'die "Installer failed at line ${LINENO}. Existing current release was not intentionally removed."' ERR

log "Titan Zero VPS installer ${INSTALLER_VERSION}"
log "Installing base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y --no-install-recommends \
  ca-certificates curl gnupg unzip rsync jq openssl \
  ufw fail2ban postgresql-client

if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker Engine"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/${ID:-ubuntu}/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  ARCH="$(dpkg --print-architecture)"
  CODENAME="${VERSION_CODENAME:-$(. /etc/os-release && echo "$VERSION_CODENAME")}" 
  echo "deb [arch=${ARCH} signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${ID:-ubuntu} ${CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

systemctl enable --now docker
systemctl enable --now fail2ban

docker compose version >/dev/null 2>&1 || die "Docker Compose plugin is unavailable"

log "Acquiring Titan Zero application archive"
if [[ "$SOURCE" =~ ^https:// ]]; then
  curl --fail --location --retry 3 --retry-delay 2 "$SOURCE" -o "$ZIP_PATH"
elif [[ "$SOURCE" =~ ^http:// ]]; then
  die "Plain HTTP sources are refused. Use HTTPS or a local file."
else
  [[ -f "$SOURCE" ]] || die "Source ZIP not found: $SOURCE"
  cp -- "$SOURCE" "$ZIP_PATH"
fi

[[ -s "$ZIP_PATH" ]] || die "Downloaded/copied ZIP is empty"
unzip -tq "$ZIP_PATH" >/dev/null || die "ZIP integrity check failed"

log "Checking archive path safety"
python3 - "$ZIP_PATH" <<'PY'
import sys, zipfile
p = sys.argv[1]
with zipfile.ZipFile(p) as z:
    for info in z.infolist():
        name = info.filename.replace('\\', '/')
        parts = [x for x in name.split('/') if x not in ('', '.')]
        if name.startswith('/') or any(x == '..' for x in parts):
            raise SystemExit(f"unsafe ZIP path: {info.filename}")
        if '\x00' in name:
            raise SystemExit("NUL byte in ZIP path")
print("archive-path-safety: PASS")
PY

mkdir -p "$EXTRACT_DIR"
unzip -q "$ZIP_PATH" -d "$EXTRACT_DIR"

# Locate repository root whether the ZIP is flat or wrapped in one directory.
REPO_SRC=""
if [[ -f "$EXTRACT_DIR/package.json" && -d "$EXTRACT_DIR/apps/web" ]]; then
  REPO_SRC="$EXTRACT_DIR"
else
  while IFS= read -r candidate; do
    candidate="$(dirname "$candidate")"
    if [[ -d "$candidate/apps/web" && -f "$candidate/pnpm-workspace.yaml" ]]; then
      REPO_SRC="$candidate"
      break
    fi
  done < <(find "$EXTRACT_DIR" -maxdepth 3 -type f -name package.json -print)
fi
[[ -n "$REPO_SRC" ]] || die "Could not locate Titan Zero repository root in ZIP"

for required in package.json pnpm-workspace.yaml apps/web/Dockerfile services/worker/Dockerfile scripts/db-migrate.sh; do
  [[ -e "$REPO_SRC/$required" ]] || die "Required application file missing: $required"
done

mkdir -p "$RELEASES_DIR" "$SHARED_DIR" "$ENV_DIR" "$DATA_DIR/postgres" "$DATA_DIR/redis" "$DATA_DIR/uploads" "$BACKUP_DIR"
mkdir -p "$RELEASE_DIR"
rsync -a --delete --exclude '.git' "$REPO_SRC/" "$RELEASE_DIR/"

ENV_FILE="${ENV_DIR}/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  log "Creating production environment file"
  cp "$RELEASE_DIR/.env.example" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
else
  log "Preserving existing environment file: $ENV_FILE"
  cp -a "$ENV_FILE" "${BACKUP_DIR}/env-${TIMESTAMP}.backup"
fi

set_env() {
  local key="$1" value="$2" file="$3"
  python3 - "$key" "$value" "$file" <<'PY'
import pathlib, sys
key, value, filename = sys.argv[1:]
p = pathlib.Path(filename)
lines = p.read_text().splitlines() if p.exists() else []
out=[]
found=False
for line in lines:
    if line.startswith(key + '='):
        if not found:
            out.append(f"{key}={value}")
            found=True
    else:
        out.append(line)
if not found:
    out.append(f"{key}={value}")
p.write_text("\n".join(out) + "\n")
PY
}

# Generate secrets only when a usable value is not already present.
get_env() {
  local key="$1" file="$2"
  grep -m1 -E "^${key}=" "$file" 2>/dev/null | cut -d= -f2- || true
}

ensure_secret() {
  local key="$1" generator="$2" file="$3" current
  current="$(get_env "$key" "$file")"
  if [[ -z "$current" || "$current" == change_me* || "$current" == ai_fsm_dev_password ]]; then
    set_env "$key" "$(eval "$generator")" "$file"
  fi
}

PUBLIC_SCHEME="http"
[[ -n "$DOMAIN" && $NO_TLS -eq 0 ]] && PUBLIC_SCHEME="https"
PUBLIC_HOST="${DOMAIN:-$(hostname -I 2>/dev/null | awk '{print $1}') }"
PUBLIC_HOST="${PUBLIC_HOST// /}"
[[ -n "$PUBLIC_HOST" ]] || PUBLIC_HOST="localhost"
PUBLIC_URL="${PUBLIC_SCHEME}://${PUBLIC_HOST}"

set_env NODE_ENV production "$ENV_FILE"
set_env APP_PORT "$APP_PORT" "$ENV_FILE"
[[ -n "$APP_DOMAIN" ]] && set_env APP_DOMAIN "$APP_DOMAIN" "$ENV_FILE"
set_env APP_BASE_URL "$PUBLIC_URL" "$ENV_FILE"
set_env APP_URL "$PUBLIC_URL" "$ENV_FILE"
set_env DATABASE_DIALECT postgres "$ENV_FILE"
set_env POSTGRES_HOST postgres "$ENV_FILE"
set_env POSTGRES_PORT 5432 "$ENV_FILE"

[[ -n "$(get_env POSTGRES_DB "$ENV_FILE")" ]] || set_env POSTGRES_DB titan_zero "$ENV_FILE"
[[ -n "$(get_env POSTGRES_USER "$ENV_FILE")" ]] || set_env POSTGRES_USER titan_zero "$ENV_FILE"
ensure_secret POSTGRES_PASSWORD "openssl rand -hex 24" "$ENV_FILE"
ensure_secret AUTH_SECRET "openssl rand -hex 32" "$ENV_FILE"
ensure_secret APP_ENCRYPTION_KEY "openssl rand -base64 32 | tr -d '\\n'" "$ENV_FILE"

BOOKING_ID="$(get_env BOOKING_ACCOUNT_ID "$ENV_FILE")"
if [[ -z "$BOOKING_ID" || "$BOOKING_ID" == "00000000-0000-0000-0000-000000000000" ]]; then
  set_env BOOKING_ACCOUNT_ID "$(cat /proc/sys/kernel/random/uuid)" "$ENV_FILE"
fi

DB_NAME="$(get_env POSTGRES_DB "$ENV_FILE")"
DB_USER="$(get_env POSTGRES_USER "$ENV_FILE")"
DB_PASS="$(get_env POSTGRES_PASSWORD "$ENV_FILE")"
set_env DATABASE_URL "postgresql://${DB_USER}:${DB_PASS}@postgres:5432/${DB_NAME}" "$ENV_FILE"
set_env REDIS_URL "redis://redis:6379/0" "$ENV_FILE"
[[ -n "$(get_env REDIS_MAXMEMORY "$ENV_FILE")" ]] || set_env REDIS_MAXMEMORY "256mb" "$ENV_FILE"
[[ -n "$(get_env REDIS_CONTAINER_MEMORY_LIMIT "$ENV_FILE")" ]] || set_env REDIS_CONTAINER_MEMORY_LIMIT "384M" "$ENV_FILE"
[[ -n "$(get_env REDIS_CONTAINER_MEMORY_RESERVATION "$ENV_FILE")" ]] || set_env REDIS_CONTAINER_MEMORY_RESERVATION "128M" "$ENV_FILE"

cat > "$RELEASE_DIR/infra/compose.vps.yml" <<'YAML'
name: titan-zero
services:
  web:
    build:
      context: ..
      dockerfile: apps/web/Dockerfile
    image: titan-zero-web:${APP_TAG:-latest}
    restart: unless-stopped
    env_file:
      - ${TZ_ENV_FILE}
    environment:
      NODE_ENV: production
      APP_PORT: "3000"
      SECURE_COOKIES: "${SECURE_COOKIES:-true}"
      REDIS_URL: "${REDIS_URL:?required}"
    ports:
      - "127.0.0.1:${APP_PORT:-3000}:3000"
    depends_on:
      redis:
    image: redis:7-alpine
    restart: unless-stopped
    stop_grace_period: 30s
    command:
      - redis-server
      - --appendonly
      - "yes"
      - --appendfsync
      - everysec
      - --aof-use-rdb-preamble
      - "yes"
      - --save
      - "60"
      - "1000"
      - --maxmemory
      - ${REDIS_MAXMEMORY:-256mb}
      - --maxmemory-policy
      - noeviction
      - --tcp-keepalive
      - "60"
    volumes:
      - titan_zero_redis:/data
    healthcheck:
      test: ["CMD-SHELL", "redis-cli ping | grep -q PONG && redis-cli INFO persistence | grep -q 'loading:0' && redis-cli INFO persistence | grep -q 'aof_enabled:1'"]
      interval: 10s
      timeout: 5s
      retries: 12
      start_period: 10s
    deploy:
      resources:
        limits:
          memory: ${REDIS_CONTAINER_MEMORY_LIMIT:-384M}
        reservations:
          memory: ${REDIS_CONTAINER_MEMORY_RESERVATION:-128M}
    networks: [app]
    logging:
      driver: json-file
      options: {max-size: "50m", max-file: "3"}

  postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ${TZ_DATA_ROOT}/uploads:/app/uploads
    networks: [app]
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:3000/api/health >/dev/null 2>&1 || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 6
      start_period: 30s
    logging:
      driver: json-file
      options: {max-size: "50m", max-file: "3"}

  worker:
    build:
      context: ..
      dockerfile: services/worker/Dockerfile
    image: titan-zero-worker:${APP_TAG:-latest}
    restart: unless-stopped
    env_file:
      - ${TZ_ENV_FILE}
    environment:
      NODE_ENV: production
      REDIS_URL: "${REDIS_URL:?required}"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ${TZ_DATA_ROOT}/uploads:/app/uploads
    networks: [app]
    logging:
      driver: json-file
      options: {max-size: "50m", max-file: "3"}

  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:?required}
      POSTGRES_USER: ${POSTGRES_USER:?required}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?required}
    volumes:
      - ${TZ_DATA_ROOT}/postgres:/var/lib/postgresql/data
    # Loopback-only exposure is intentional: the migration script can use the
    # host psql client without making PostgreSQL Internet-accessible.
    ports:
      - "127.0.0.1:5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 12
      start_period: 10s
    networks: [app]
    logging:
      driver: json-file
      options: {max-size: "50m", max-file: "3"}

volumes:
  titan_zero_redis:

networks:
  app:
    driver: bridge
YAML

chmod 600 "$ENV_FILE"
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"

COMPOSE_FILE="$CURRENT_LINK/infra/compose.vps.yml"
export TZ_ENV_FILE="$ENV_FILE"
export TZ_DATA_ROOT="$DATA_DIR"
export APP_PORT
export POSTGRES_DB="$DB_NAME"
export POSTGRES_USER="$DB_USER"
export POSTGRES_PASSWORD="$DB_PASS"
export REDIS_URL="$(get_env REDIS_URL "$ENV_FILE")"
export REDIS_MAXMEMORY="$(get_env REDIS_MAXMEMORY "$ENV_FILE")"
export REDIS_CONTAINER_MEMORY_LIMIT="$(get_env REDIS_CONTAINER_MEMORY_LIMIT "$ENV_FILE")"
export REDIS_CONTAINER_MEMORY_RESERVATION="$(get_env REDIS_CONTAINER_MEMORY_RESERVATION "$ENV_FILE")"

redis_diagnostics() {
  warn "Redis diagnostics follow"
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps redis >&2 || true
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=120 redis >&2 || true
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T redis redis-cli INFO persistence >&2 || true
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T redis redis-cli INFO memory >&2 || true
}

log "Running Redis preflight validation"
[[ -n "$REDIS_URL" ]] || die "REDIS_URL is missing. Expected redis://redis:6379/0 in the VPS environment file."
[[ "$REDIS_URL" =~ ^redis://redis:6379/[0-9]+$ ]] || die "REDIS_URL must target the internal compose service, e.g. redis://redis:6379/0; refusing external/ambiguous Redis target: $REDIS_URL"
[[ "$REDIS_MAXMEMORY" =~ ^[1-9][0-9]*(kb|mb|gb|KB|MB|GB)$ ]] || die "REDIS_MAXMEMORY must be a positive Redis memory value such as 256mb; got: $REDIS_MAXMEMORY"
[[ "$REDIS_CONTAINER_MEMORY_LIMIT" =~ ^[1-9][0-9]*(m|g|M|G)$ ]] || die "REDIS_CONTAINER_MEMORY_LIMIT must be a positive compose memory value such as 384m; got: $REDIS_CONTAINER_MEMORY_LIMIT"
[[ "$REDIS_CONTAINER_MEMORY_RESERVATION" =~ ^[1-9][0-9]*(m|g|M|G)$ ]] || die "REDIS_CONTAINER_MEMORY_RESERVATION must be a positive compose memory value such as 128m; got: $REDIS_CONTAINER_MEMORY_RESERVATION"
docker info >/dev/null 2>&1 || die "Docker daemon is unavailable. Start Docker and re-run the installer."
docker image inspect redis:7-alpine >/dev/null 2>&1 || log "Redis image not cached locally; Docker will pull redis:7-alpine during startup"

log "Validating Docker Compose configuration"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" config >/dev/null

log "Starting PostgreSQL and Redis"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d postgres redis

log "Waiting for PostgreSQL readiness"
ready=0
for _ in $(seq 1 30); do
  if docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
      pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    ready=1; break
  fi
  sleep 2
done
[[ $ready -eq 1 ]] || die "PostgreSQL did not become healthy"

log "Waiting for Redis readiness"
redis_ready=0
for _ in $(seq 1 30); do
  if docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T redis redis-cli ping 2>/dev/null | grep -qx PONG; then
    redis_ready=1; break
  fi
  sleep 2
done
if [[ $redis_ready -ne 1 ]]; then
  redis_diagnostics
  die "Redis did not become healthy. Check disk space, named-volume permissions, memory settings, and redis logs above; then re-run the installer."
fi

log "Validating Redis runtime persistence contract"
redis_ping="$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T redis redis-cli ping 2>/dev/null || true)"
[[ "$redis_ping" == "PONG" ]] || { redis_diagnostics; die "Redis readiness validation failed after startup: expected PONG."; }
redis_persistence="$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T redis redis-cli INFO persistence 2>/dev/null || true)"
grep -q 'loading:0' <<<"$redis_persistence" || { redis_diagnostics; die "Redis is still loading persisted data; refusing to start web/worker."; }
grep -q 'aof_enabled:1' <<<"$redis_persistence" || { redis_diagnostics; die "Redis AOF persistence is not enabled; refusing to start web/worker."; }

log "Applying database migrations"
HOST_DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}"
(
  cd "$CURRENT_LINK"
  DATABASE_URL="$HOST_DATABASE_URL" bash scripts/db-migrate.sh
)

log "Building Titan Zero containers"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build web worker

log "Starting Titan Zero"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d

install_caddy() {
  if command -v caddy >/dev/null 2>&1; then
    log "Caddy already installed: $(caddy version 2>/dev/null || true)"
    return 0
  fi

  log "Installing Caddy from the official package repository"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key \
    | gpg --dearmor -o /etc/apt/keyrings/caddy-stable-archive-keyring.gpg
  chmod a+r /etc/apt/keyrings/caddy-stable-archive-keyring.gpg
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt \
    -o /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
}

install_caddy

CADDYFILE="/etc/caddy/Caddyfile"
CADDY_SITE="${APP_DOMAIN:-http://:80}"
if [[ -n "$APP_DOMAIN" && $NO_TLS -eq 1 ]]; then
  CADDY_SITE="http://${APP_DOMAIN}"
fi

log "Writing Caddy reverse-proxy configuration"
SECURITY_HEADERS=""
if [[ -n "$APP_DOMAIN" && $NO_TLS -eq 0 ]]; then
  SECURITY_HEADERS=$(cat <<'SECURITY_TLS'
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
        Permissions-Policy "camera=(self), microphone=(self), geolocation=(self)"
        -Server
    }
    tls {
        protocols tls1.2 tls1.3
    }
SECURITY_TLS
)
else
  SECURITY_HEADERS=$(cat <<'SECURITY_HTTP'
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
        Permissions-Policy "camera=(self), microphone=(self), geolocation=(self)"
        -Server
    }
SECURITY_HTTP
)
fi

cat > "$CADDYFILE" <<CADDY
{
    email ${EMAIL:-off}
}

${CADDY_SITE} {
    encode zstd gzip
${SECURITY_HEADERS}
    request_body {
        max_size 64MB
    }
    reverse_proxy 127.0.0.1:${APP_PORT} {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
        transport http {
            read_timeout 300s
        }
    }
}
CADDY

# Remove the global email directive when TLS is disabled or no ACME email is needed.
if [[ -z "$EMAIL" ]]; then
  python3 - "$CADDYFILE" <<'PY_CADDY'
from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text()
s=s.replace('{\n    email off\n}\n\n','')
p.write_text(s)
PY_CADDY
fi

caddy validate --config "$CADDYFILE" --adapter caddyfile
systemctl enable --now caddy
# Reload is intentionally idempotent: reruns preserve Caddy's managed certificate state.
systemctl reload caddy

log "Configuring firewall"
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null

verify_caddy_tls_lifecycle() {
  [[ -n "$APP_DOMAIN" && $NO_TLS -eq 0 ]] || return 0

  log "Verifying Caddy automatic certificate issuance for ${APP_DOMAIN}"
  local ready=0
  for _ in $(seq 1 30); do
    if curl -fsS --connect-timeout 5 --max-time 15 "https://${APP_DOMAIN}/api/health" >/dev/null 2>&1; then
      ready=1
      break
    fi
    sleep 2
  done

  if [[ $ready -ne 1 ]]; then
    journalctl -u caddy --no-pager -n 80 >&2 || true
    die "HTTPS certificate/health verification failed for ${APP_DOMAIN}; verify DNS A/AAAA records and inbound ports 80/443"
  fi

  local cert_end
  cert_end="$(echo | openssl s_client -servername "$APP_DOMAIN" -connect "${APP_DOMAIN}:443" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null | sed 's/^notAfter=//' || true)"
  [[ -n "$cert_end" ]] || die "HTTPS responded but certificate expiry could not be read for ${APP_DOMAIN}"
  log "Caddy-managed certificate active for ${APP_DOMAIN}; expires: ${cert_end}"
  log "Renewal is automatic under Caddy; installer reruns reload config without deleting managed certificate storage"
}

if [[ -n "$APP_DOMAIN" && $NO_TLS -eq 0 ]]; then
  verify_caddy_tls_lifecycle
else
  log "Caddy HTTP profile enabled; automatic HTTPS is intentionally disabled for this profile"
fi

log "Waiting for application health"
healthy=0
for _ in $(seq 1 45); do
  if curl -fsS "http://127.0.0.1:${APP_PORT}/api/health" >/dev/null 2>&1; then
    healthy=1; break
  fi
  sleep 3
done
if [[ $healthy -ne 1 ]]; then
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps >&2 || true
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=100 web >&2 || true
  die "Titan Zero did not pass its local health check"
fi

# Pass 6: certificate health telemetry and 30-day expiry warning.
# This is local-first operational telemetry: it writes a machine-readable snapshot,
# emits warnings to journald, and does not require an external monitoring vendor.
TLS_STATUS_FILE="${DATA_DIR}/tls-health.json"
TLS_WARN_DAYS="${TLS_EXPIRY_WARN_DAYS:-30}"

cat > /usr/local/bin/titan-zero-tls-status <<'EOF_TLS_STATUS'
#!/usr/bin/env bash
set -euo pipefail
ENV_FILE="${TZ_ENV_FILE:-/etc/titan-zero/titan-zero.env}"
STATUS_FILE="${TZ_TLS_STATUS_FILE:-/var/lib/titan-zero/tls-health.json}"
WARN_DAYS="${TLS_EXPIRY_WARN_DAYS:-30}"
[[ -f "$ENV_FILE" ]] && { set -a; source "$ENV_FILE"; set +a; }
DOMAIN="${APP_DOMAIN:-}"
NO_TLS_VALUE="${NO_TLS:-0}"
mkdir -p "$(dirname "$STATUS_FILE")"
now_epoch="$(date +%s)"
checked_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

write_json() {
  local state="$1" days="$2" expiry="$3" message="$4"
  python3 - "$STATUS_FILE" "$DOMAIN" "$state" "$days" "$expiry" "$checked_at" "$message" <<'PY_TLS_JSON'
import json, sys
path, domain, state, days, expiry, checked, message = sys.argv[1:]
payload = {
    "schema": "titan-zero-tls-health/v1",
    "domain": domain or None,
    "state": state,
    "days_remaining": None if days == "null" else int(days),
    "expires_at": expiry or None,
    "checked_at": checked,
    "message": message,
}
with open(path, "w", encoding="utf-8") as f:
    json.dump(payload, f, indent=2, sort_keys=True)
    f.write("\\n")
PY_TLS_JSON
  cat "$STATUS_FILE"
}

if [[ -z "$DOMAIN" || "$NO_TLS_VALUE" == "1" ]]; then
  write_json "disabled" null "" "TLS monitoring disabled for this profile"
  exit 0
fi

cert_end="$(timeout 15 openssl s_client -servername "$DOMAIN" -connect "${DOMAIN}:443" </dev/null 2>/dev/null \
  | openssl x509 -noout -enddate 2>/dev/null | sed 's/^notAfter=//' || true)"
if [[ -z "$cert_end" ]]; then
  write_json "unreachable" null "" "Unable to read served TLS certificate"
  logger -t titan-zero-tls "CRITICAL: unable to read served TLS certificate for ${DOMAIN}"
  exit 2
fi

expiry_epoch="$(date -d "$cert_end" +%s 2>/dev/null || true)"
if [[ -z "$expiry_epoch" ]]; then
  write_json "parse_error" null "$cert_end" "Unable to parse certificate expiry"
  logger -t titan-zero-tls "CRITICAL: unable to parse TLS expiry for ${DOMAIN}: ${cert_end}"
  exit 2
fi

days_remaining="$(( (expiry_epoch - now_epoch) / 86400 ))"
state="healthy"
message="Certificate healthy"
exit_code=0
if (( days_remaining < 0 )); then
  state="expired"; message="Certificate expired"; exit_code=2
elif (( days_remaining <= WARN_DAYS )); then
  state="warning"; message="Certificate expires within ${WARN_DAYS} days"; exit_code=1
fi

write_json "$state" "$days_remaining" "$cert_end" "$message"
if [[ "$state" == "warning" ]]; then
  logger -t titan-zero-tls "WARNING: ${DOMAIN} TLS certificate expires in ${days_remaining} days (${cert_end})"
elif [[ "$state" == "expired" ]]; then
  logger -t titan-zero-tls "CRITICAL: ${DOMAIN} TLS certificate expired ${cert_end}"
fi
exit "$exit_code"
EOF_TLS_STATUS
chmod 755 /usr/local/bin/titan-zero-tls-status

cat > /etc/systemd/system/titan-zero-tls-health.service <<EOF_TLS_SERVICE
[Unit]
Description=Titan Zero TLS certificate health check
After=network-online.target caddy.service
Wants=network-online.target

[Service]
Type=oneshot
Environment=TZ_ENV_FILE=${ENV_FILE}
Environment=TZ_TLS_STATUS_FILE=${TLS_STATUS_FILE}
Environment=TLS_EXPIRY_WARN_DAYS=${TLS_WARN_DAYS}
ExecStart=/usr/local/bin/titan-zero-tls-status
# A warning threshold is operational evidence, not a service crash.
SuccessExitStatus=1
EOF_TLS_SERVICE

cat > /etc/systemd/system/titan-zero-tls-health.timer <<'EOF_TLS_TIMER'
[Unit]
Description=Run Titan Zero TLS certificate health check daily

[Timer]
OnBootSec=10m
OnUnitActiveSec=24h
RandomizedDelaySec=15m
Persistent=true

[Install]
WantedBy=timers.target
EOF_TLS_TIMER

systemctl daemon-reload
systemctl enable --now titan-zero-tls-health.timer
if [[ -n "$APP_DOMAIN" && $NO_TLS -eq 0 ]]; then
  # Run once immediately. Exit 1 means <=30-day warning and is intentionally non-fatal here.
  /usr/local/bin/titan-zero-tls-status >/dev/null || tls_status_rc=$?
  tls_status_rc="${tls_status_rc:-0}"
  if [[ "$tls_status_rc" -ge 2 ]]; then
    journalctl -u titan-zero-tls-health.service --no-pager -n 50 >&2 || true
    log "WARNING: initial TLS health telemetry could not verify the served certificate; timer remains enabled for recovery checks"
  elif [[ "$tls_status_rc" -eq 1 ]]; then
    log "WARNING: TLS certificate is within ${TLS_WARN_DAYS} days of expiry; Caddy should renew automatically and the daily monitor will recheck"
  else
    log "TLS certificate health telemetry installed; daily monitor enabled with ${TLS_WARN_DAYS}-day warning threshold"
  fi
else
  log "TLS certificate telemetry installed but inactive for HTTP/no-domain profile"
fi

cat > /usr/local/bin/titan-zero-status <<EOF_STATUS
#!/usr/bin/env bash
set -e
export TZ_ENV_FILE='${ENV_FILE}' TZ_DATA_ROOT='${DATA_DIR}' APP_PORT='${APP_PORT}'
set -a; source '${ENV_FILE}'; set +a
exec docker compose --env-file '${ENV_FILE}' -f '${CURRENT_LINK}/infra/compose.vps.yml' ps
EOF_STATUS
chmod 755 /usr/local/bin/titan-zero-status

cat > /usr/local/bin/titan-zero-logs <<EOF_LOGS
#!/usr/bin/env bash
set -e
export TZ_ENV_FILE='${ENV_FILE}' TZ_DATA_ROOT='${DATA_DIR}' APP_PORT='${APP_PORT}'
set -a; source '${ENV_FILE}'; set +a
exec docker compose --env-file '${ENV_FILE}' -f '${CURRENT_LINK}/infra/compose.vps.yml' logs -f --tail=200 "\$@"
EOF_LOGS
chmod 755 /usr/local/bin/titan-zero-logs

FINAL_URL="${PUBLIC_URL}"
log "Installation complete"
printf '\nTitan Zero URL:       %s\n' "$FINAL_URL"
printf 'Install root:         %s\n' "$INSTALL_ROOT"
printf 'Current release:      %s\n' "$RELEASE_DIR"
printf 'Environment file:     %s\n' "$ENV_FILE"
printf 'Status command:       titan-zero-status\n'
printf 'TLS status command:   titan-zero-tls-status\n'
printf 'Logs command:         titan-zero-logs [web|worker|postgres|redis]\n'
printf '\nIMPORTANT: Configure SMTP/AI/payment/storage settings in %s as needed.\n' "$ENV_FILE"
printf 'Keep %s and your PostgreSQL backups protected.\n' "$ENV_FILE"
