> This is the bounded SQLite compatibility installation used by mission #970.
> Current Blueprint v3 assigns new operational business domains to the per-company
> Frappe/ERPNext provider (#1051) and DirectAdmin control plane (#812). This guide
> does not certify those providers or turn SQLite business tables into their replacement.

# Titan Zero VPS installation

The current installer uses **SQLite**, the actual `infra/compose.vps.yml`, web,
worker, and persistent Workforce images, Redis with AOF, and Caddy. PostgreSQL is
not installed by this path.
SQLite data lives at `/opt/titan-zero/shared/data/sqlite/titan-zero.db`; uploads and
secrets live under the same shared directory. Redis remains a queue dependency.

Use a **disposable Ubuntu/Debian host** for release acceptance. The installer
installs system packages, writes `/etc/caddy/Caddyfile`, enables services and UFW,
and opens ports 80/443. It is not an in-place DirectAdmin integration procedure.
Use an isolated VM for these tests if the access host also runs DirectAdmin.

## Install and upgrade

Run the installer from the same commit as the supplied ZIP:

```bash
sudo bash scripts/vps/install-vps.sh \
  --source /root/titan-zero.zip \
  --app-domain app.example.com
```

Supported options are `--source`, `--app-domain` (or `--domain`), `--install-root`,
`--app-port`, and `--no-tls`. There is no `--email` option. DNS must point at the
host for public HTTPS. For disposable HTTP testing, use `--no-tls` (the installer
sets insecure cookies only for this explicit mode).

The installer builds before migration, runs the migration script bundled in the
web image without masking its installed modules with a source bind mount, then
starts services and checks `/api/health`. It keeps immutable release directories
and updates `/opt/titan-zero/current`. Rerun with a new exact ZIP to upgrade after
backing up. The legacy in-place updater is disabled.

Inspect the actual services (no `titan-zero-status` helper is installed):

```bash
export TZ_ENV_FILE=/opt/titan-zero/shared/env/.env
export TZ_DATA_ROOT=/opt/titan-zero/shared/data
docker compose --env-file "$TZ_ENV_FILE" \
  -f /opt/titan-zero/current/infra/compose.vps.yml ps
docker compose --env-file "$TZ_ENV_FILE" \
  -f /opt/titan-zero/current/infra/compose.vps.yml logs --tail=100 web worker workforce
```

Keep the environment file private. Configure real company/users and external
services separately; a random booking ID or a healthy process is not onboarding.
The bounded Zero completion path also requires an active digital Workforce agent
with `work.delegate` and `crm.work_order.complete`, company-scoped field evidence,
an active `worker_access_assignments` grant for `crm.work_order.complete`,
and existing scoped policy, verified autonomy snapshot and work-order approval.
The composition reads these records; it never grants itself authority.

## Bounded Zero job verification

Authenticate as the assigned lead (an owner/admin can also be the assigned lead),
open `/app/zero`, and send `complete work order <id>`. The existing operation checks
assignment, visit completion and required checklist tasks. It does not complete
the parent project or issue an invoice. `/api/v1/zero/interactions?work_id=<id>` and
the Zero page reread persisted WorkItem/run/business/evidence records. A provider
acknowledgement alone is not verified completion.

The migration adds only the SQLite tables/compatibility fields needed for this
bounded operation. It does **not** certify every legacy web workflow on SQLite.
Evidence is persisted provenance for this path; the rest of the state tables are
not claimed to be fully ledger-derived. Startup replay recovers an interrupted
WorkItem/QUEUED run and reconciles persisted terminal/waiting runs. An interrupted
RUNNING/WAITING_TOOL run is left visibly unverified for investigation; it is not
blindly re-executed when the prior external outcome is unknown. This bounded
synchronous completion path does not certify a general background worker queue.

## Backup and restore

The existing backup script takes a consistent SQLite snapshot with `VACUUM INTO`
and checks its integrity. It does not back up uploaded files, environment secrets,
or Redis. Back those up separately with access permissions preserved.

```bash
sudo bash /opt/titan-zero/current/scripts/vps/backup-vps.sh
```

Test restoration on the disposable host: stop web and worker, retain a backup of
the current database, restore the chosen snapshot using SQLite's backup API, then
start services. For example, after setting the two Compose variables above:

```bash
docker compose --env-file "$TZ_ENV_FILE" \
  -f /opt/titan-zero/current/infra/compose.vps.yml stop web worker
sudo python3 - /path/to/chosen-backup.db "$TZ_DATA_ROOT/sqlite/titan-zero.db" <<'PY'
import sqlite3, sys
with sqlite3.connect(sys.argv[1]) as source, sqlite3.connect(sys.argv[2]) as target:
    assert source.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
    source.backup(target)
    assert target.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
PY
docker compose --env-file "$TZ_ENV_FILE" \
  -f /opt/titan-zero/current/infra/compose.vps.yml up -d web worker
```

Database migrations may not be reversible. Rolling code back alone is not a
reliable rollback; preserve the matching previous release and database snapshot.

## Release acceptance record

Record exact Git SHA and ZIP SHA-256, installer/build/migration commands, and
actual results for fresh install, upgrade, authenticated completion, replay,
company-B read/resume rejection, web/worker restart, and backup/restore. Record
all skipped/failed checks and external prerequisites. Health or unit tests alone
must never be reported as VPS readiness. Current mission evidence and blockers
are tracked in issue #970 and its single draft PR.
