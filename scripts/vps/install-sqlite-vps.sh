#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'
INSTALL_ROOT="${TITAN_ZERO_INSTALL_ROOT:-/opt/titan-zero}"
APP_PORT="${APP_PORT:-3000}"
SOURCE=""
APP_DOMAIN="${APP_DOMAIN:-}"
NO_TLS=0
log(){ printf '[Titan Zero] %s\n' "$*"; }
die(){ printf '[Titan Zero] ERROR: %s\n' "$*" >&2; exit 1; }
while (($#)); do
  case "$1" in
    --source) SOURCE="${2:?}"; shift 2;;
    --app-domain|--domain) APP_DOMAIN="${2:?}"; shift 2;;
    --install-root) INSTALL_ROOT="${2:?}"; shift 2;;
    --app-port) APP_PORT="${2:?}"; shift 2;;
    --no-tls) NO_TLS=1; shift;;
    *) die "Unknown argument: $1";;
  esac
done
[[ $EUID -eq 0 ]] || die 'Run as root (sudo).'
[[ -n "$SOURCE" ]] || die '--source is required.'
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y --no-install-recommends ca-certificates curl gnupg unzip rsync openssl ufw fail2ban python3
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  . /etc/os-release
  curl -fsSL "https://download.docker.com/linux/${ID}/gpg" | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${ID} ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker fail2ban
WORK="$(mktemp -d /tmp/titan-zero-sqlite.XXXXXX)"; trap 'rm -rf "$WORK"' EXIT
ZIP="$WORK/release.zip"; EXTRACT="$WORK/extract"; mkdir -p "$EXTRACT"
if [[ "$SOURCE" =~ ^https:// ]]; then curl -fL --retry 3 "$SOURCE" -o "$ZIP"; else cp -- "$SOURCE" "$ZIP"; fi
unzip -tq "$ZIP" >/dev/null || die 'Invalid ZIP.'
unzip -q "$ZIP" -d "$EXTRACT"
REPO=""
while IFS= read -r p; do d="$(dirname "$p")"; [[ -d "$d/apps/web" && -f "$d/pnpm-workspace.yaml" ]] && { REPO="$d"; break; }; done < <(find "$EXTRACT" -maxdepth 3 -name package.json -type f)
[[ -n "$REPO" ]] || die 'Titan Zero repository root not found.'
for f in infra/compose.vps.yml infra/vps.env.example scripts/sqlite-migrate.mjs apps/web/Dockerfile services/worker/Dockerfile; do [[ -e "$REPO/$f" ]] || die "Missing $f"; done
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"; RELEASE="$INSTALL_ROOT/releases/$STAMP"; SHARED="$INSTALL_ROOT/shared"; ENV="$SHARED/env/.env"; DATA="$SHARED/data"
mkdir -p "$RELEASE" "$SHARED/env" "$DATA/sqlite" "$DATA/companies" "$DATA/uploads" "$INSTALL_ROOT/backups"
rsync -a --delete --exclude .git "$REPO/" "$RELEASE/"
[[ -f "$ENV" ]] || cp "$RELEASE/infra/vps.env.example" "$ENV"
chmod 600 "$ENV"
setenv(){ python3 - "$1" "$2" "$ENV" <<'PY'
import pathlib,sys
k,v,f=sys.argv[1:]; p=pathlib.Path(f); lines=p.read_text().splitlines() if p.exists() else []; out=[]; found=False
for line in lines:
    if line.startswith(k+'='):
        if not found: out.append(f'{k}={v}'); found=True
    else: out.append(line)
if not found: out.append(f'{k}={v}')
p.write_text('\n'.join(out)+'\n')
PY
}
getenv(){ grep -m1 "^$1=" "$ENV" 2>/dev/null | cut -d= -f2- || true; }
secret(){ v="$(getenv "$1")"; [[ -n "$v" && "$v" != GENERATED_BY_INSTALLER && "$v" != change_me* ]] || setenv "$1" "$(openssl rand -hex 32)"; }
SCHEME=http; [[ -n "$APP_DOMAIN" && $NO_TLS -eq 0 ]] && SCHEME=https
HOST="${APP_DOMAIN:-$(hostname -I | awk '{print $1}')}"; URL="$SCHEME://$HOST"
setenv NODE_ENV production; setenv APP_PORT "$APP_PORT"; setenv APP_BASE_URL "$URL"; setenv APP_URL "$URL"
setenv DATABASE_DIALECT sqlite; setenv DATABASE_URL file:/app/data/titan-zero.db; setenv SQLITE_PATH /app/data/titan-zero.db; setenv TITAN_COMPANY_DATA_ROOT /app/data/companies; setenv REDIS_URL redis://redis:6379/0
[[ -n "$APP_DOMAIN" ]] && setenv APP_DOMAIN "$APP_DOMAIN"
secret AUTH_SECRET; secret APP_ENCRYPTION_KEY
[[ "$(getenv BOOKING_ACCOUNT_ID)" != 00000000-0000-0000-0000-000000000000 && -n "$(getenv BOOKING_ACCOUNT_ID)" ]] || setenv BOOKING_ACCOUNT_ID "$(cat /proc/sys/kernel/random/uuid)"
export TZ_ENV_FILE="$ENV" TZ_DATA_ROOT="$DATA" APP_PORT
COMPOSE="$RELEASE/infra/compose.vps.yml"
docker compose --env-file "$ENV" -f "$COMPOSE" config -q
docker compose --env-file "$ENV" -f "$COMPOSE" build web worker
log 'Applying SQLite migrations'
docker run --rm --env-file "$ENV" -e SQLITE_PATH=/app/data/titan-zero.db -v "$RELEASE:/app" -v "$DATA/sqlite:/app/data" -w /app "titan-zero-web:${APP_TAG:-latest}" node scripts/sqlite-migrate.mjs
docker compose --env-file "$ENV" -f "$COMPOSE" up -d
for _ in $(seq 1 60); do curl -fsS "http://127.0.0.1:$APP_PORT/api/health" >/dev/null 2>&1 && break; sleep 2; done
curl -fsS "http://127.0.0.1:$APP_PORT/api/health" >/dev/null || { docker compose --env-file "$ENV" -f "$COMPOSE" logs --tail=150; die 'Application health check failed.'; }
ln -sfn "$RELEASE" "$INSTALL_ROOT/current"
if ! command -v caddy >/dev/null; then
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y; apt-get install -y caddy
fi
SITE="http://:80"; [[ -n "$APP_DOMAIN" ]] && SITE="$APP_DOMAIN"; [[ $NO_TLS -eq 1 && -n "$APP_DOMAIN" ]] && SITE="http://$APP_DOMAIN"
cat > /etc/caddy/Caddyfile <<EOF
$SITE {
  encode zstd gzip
  reverse_proxy 127.0.0.1:$APP_PORT
}
EOF
caddy validate --config /etc/caddy/Caddyfile
systemctl enable --now caddy; systemctl reload caddy
ufw allow OpenSSH >/dev/null; ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null; ufw --force enable >/dev/null
log "Transitional Titan runtime installation healthy: $URL"
log "Compatibility/runtime database: $DATA/sqlite/titan-zero.db"
log "Native company database root reserved: $DATA/companies"
log "WARNING: this installer is not full production acceptance until persistent Workforce and database-per-company provisioning are certified."
