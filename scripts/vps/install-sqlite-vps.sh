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
for f in infra/compose.vps.yml infra/vps.env.example scripts/sqlite-migrate.mjs apps/web/Dockerfile services/worker/Dockerfile services/workforce/Dockerfile services/workforce/src/server.ts; do [[ -e "$REPO/$f" ]] || die "Missing $f"; done
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"; RELEASE="$INSTALL_ROOT/releases/$STAMP"; SHARED="$INSTALL_ROOT/shared"; ENV="$SHARED/env/.env"; DATA="$SHARED/data"
mkdir -p "$RELEASE" "$SHARED/env" "$SHARED/keys" "$DATA/sqlite" "$DATA/runtime" "$DATA/uploads" "$DATA/companies" "$INSTALL_ROOT/backups"
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
setenv DATABASE_DIALECT sqlite; setenv DATABASE_URL file:/app/data/titan-zero.db; setenv SQLITE_PATH /app/data/titan-zero.db; setenv REDIS_URL redis://redis:6379/0
[[ -n "$APP_DOMAIN" ]] && setenv APP_DOMAIN "$APP_DOMAIN"
secret AUTH_SECRET; secret APP_ENCRYPTION_KEY
[[ $NO_TLS -eq 1 ]] && setenv SECURE_COOKIES false || setenv SECURE_COOKIES true
# Workforce company storage and identity DB are node-owned locations. The
# identity and placement registry schemas/data are provisioned by their
# canonical owners.
[[ "$(getenv WORKFORCE_COMPANY_STORE_HOST_ROOT)" == /opt/titan-zero/shared/data/companies ]] \
  && setenv WORKFORCE_COMPANY_STORE_HOST_ROOT "$DATA/companies"
[[ "$(getenv WORKFORCE_IDENTITY_SQLITE_HOST_PATH)" == /opt/titan-zero/shared/data/runtime/identity.db ]] \
  && setenv WORKFORCE_IDENTITY_SQLITE_HOST_PATH "$DATA/runtime/identity.db"
[[ "$(getenv WORKFORCE_SESSION_PUBLIC_KEY_HOST_PATH)" == /opt/titan-zero/shared/keys/workforce-session.pub.pem ]] \
  && setenv WORKFORCE_SESSION_PUBLIC_KEY_HOST_PATH "$SHARED/keys/workforce-session.pub.pem"
[[ "$(getenv WORKFORCE_UPSTREAM_SESSION_PUBLIC_KEY_HOST_PATH)" == /opt/titan-zero/shared/keys/upstream-session.pub.pem ]] \
  && setenv WORKFORCE_UPSTREAM_SESSION_PUBLIC_KEY_HOST_PATH "$SHARED/keys/upstream-session.pub.pem"

for key in WORKFORCE_DIRECTADMIN_NODE_ID WORKFORCE_SESSION_ISSUER WORKFORCE_SESSION_KEY_ID \
  WORKFORCE_UPSTREAM_SESSION_ISSUER WORKFORCE_UPSTREAM_SESSION_AUDIENCE WORKFORCE_UPSTREAM_SESSION_KEY_ID; do
  value="$(getenv "$key")"
  [[ -n "$value" && "$value" != REPLACE_* && "$value" != *[[:space:]]* ]] \
    || die "Set a valid $key in $ENV using the value from its trusted issuer."
done
for key in WORKFORCE_SESSION_ALGORITHM WORKFORCE_UPSTREAM_SESSION_ALGORITHM; do
  case "$(getenv "$key")" in EdDSA|ES256|RS256) ;; *) die "$key must be EdDSA, ES256, or RS256.";; esac
done
for key in WORKFORCE_SESSION_PUBLIC_KEY_HOST_PATH WORKFORCE_UPSTREAM_SESSION_PUBLIC_KEY_HOST_PATH; do
  key_file="$(getenv "$key")"
  [[ "$key_file" == /* && -f "$key_file" && ! -L "$key_file" ]] \
    || die "Provide the trusted public key file for $key before installing."
  openssl pkey -pubin -in "$key_file" -noout >/dev/null 2>&1 \
    || die "$key must reference a valid PEM public key; private keys are not accepted."
done
IDENTITY_DB="$(getenv WORKFORCE_IDENTITY_SQLITE_HOST_PATH)"
[[ "$IDENTITY_DB" == /* && -f "$IDENTITY_DB" && ! -L "$IDENTITY_DB" ]] \
  || die "Provision the trusted Workforce global identity/placement registry before installing; the installer will not invent identity or company authority data."
# Never mint a legacy account selector here. Public booking must use a trusted
# company/surface context; an installer-generated UUID is not company identity.
export TZ_ENV_FILE="$ENV" TZ_DATA_ROOT="$DATA" APP_PORT
COMPOSE="$RELEASE/infra/compose.vps.yml"
docker compose --env-file "$ENV" -f "$COMPOSE" config -q
docker compose --env-file "$ENV" -f "$COMPOSE" build web worker workforce
log 'Applying SQLite migrations'
docker compose --env-file "$ENV" -f "$COMPOSE" run --rm --no-deps web node sqlite-migrate.mjs
docker compose --env-file "$ENV" -f "$COMPOSE" up -d
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:$APP_PORT/api/health" >/dev/null 2>&1 \
    && curl -fsS "http://127.0.0.1:3010/health" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
curl -fsS "http://127.0.0.1:$APP_PORT/api/health" >/dev/null || { docker compose --env-file "$ENV" -f "$COMPOSE" logs --tail=150; die 'Application health check failed.'; }
curl -fsS "http://127.0.0.1:3010/health" >/dev/null || { docker compose --env-file "$ENV" -f "$COMPOSE" logs --tail=150 workforce; die 'Workforce process health check failed.'; }
WORKFORCE_READY_STATUS="$(curl --silent --show-error --output "$WORK/ready.json" --write-out '%{http_code}' "http://127.0.0.1:3010/ready" || true)"
case "$WORKFORCE_READY_STATUS" in
  200) log 'Workforce readiness: ready';;
  503) log 'Workforce process is healthy but not commissioned; /ready remains 503 until identity, authority, evidence, and a READY company placement are provisioned.';;
  *) docker compose --env-file "$ENV" -f "$COMPOSE" logs --tail=150 workforce; die "Unexpected Workforce readiness response: ${WORKFORCE_READY_STATUS:-unreachable}.";;
esac
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
log "SQLite-first installation process checks passed: $URL"
log "Database: $DATA/sqlite/titan-zero.db"
