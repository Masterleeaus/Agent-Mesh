# Titan Zero VPS installation

The VPS installer accepts a ZIP of this repository. It installs Docker Compose,
PostgreSQL, Redis and Caddy on an Ubuntu/Debian host, builds the web and worker
images from the supplied source, applies database migrations and checks the
application health endpoint. A domain with DNS pointing at the VPS enables
automatic HTTPS. The application port is bound to localhost behind Caddy.

```bash
# On the VPS, after copying a current repository ZIP to /root/titan-zero.zip:
sudo bash scripts/vps/install-vps.sh \
  --source /root/titan-zero.zip \
  --app-domain app.example.com \
  --email owner@example.com

titan-zero-status
titan-zero-logs web
```

Run the installer script from a checkout of the **same commit** as the ZIP.
It installs into `/opt/titan-zero`; persistent data and secrets are under
`/opt/titan-zero/shared/`. Keep the generated environment file private. Set
SMTP and the real booking account before enabling public intake.

## Database status

The operational web app currently uses a PostgreSQL pool and session settings.
The separate SQLite migrations and storage adapter do not yet make this web
application SQLite-only. This installer uses the PostgreSQL compatibility path
until that conversion is certified. It must not be advertised as a SQLite
deployment. PostgreSQL binds only to VPS loopback for the migration client.

## Before using a production VPS

Test a fresh install and upgrade on a disposable VPS with the exact release ZIP.
The local installer checks syntax, Compose configuration, image builds and app
health, but cannot prove DNS, SMTP, provider configuration or business workflows
without real credentials. Back up the PostgreSQL database and shared uploads
before an upgrade; database migrations may not be reversible.

The repository's older `scripts/vps/update-vps.sh` and `backup-vps.sh` were
written for a flat Merge 74 bundle, not the current release-directory layout.
Use `titan-zero-status`/`titan-zero-logs` for inspection and rerun the installer
with the new source ZIP for an upgrade. For a database backup:

```bash
sudo mkdir -p /opt/titan-zero/backups
sudo bash -c 'set -a; source /opt/titan-zero/shared/env/.env; set +a; \
  TZ_ENV_FILE=/opt/titan-zero/shared/env/.env \
  TZ_DATA_ROOT=/opt/titan-zero/shared/data \
  docker compose --env-file /opt/titan-zero/shared/env/.env \
    -f /opt/titan-zero/current/infra/compose.vps.yml exec -T postgres \
    pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > \
    /opt/titan-zero/backups/titan-zero-$(date +%Y%m%d-%H%M%S).sql.gz'
```
