#!/usr/bin/env bash
set -Eeuo pipefail

cat >&2 <<'EOF'
Titan Zero's legacy in-place VPS updater is intentionally disabled.

Current deployments use immutable release directories under /opt/titan-zero/releases
with /opt/titan-zero/current pointing to the active release. Rebuilding files in
scripts/vps directly would bypass that deployment model and could apply database
changes without a safe release handoff.

To upgrade:
  1. Create a SQLite backup with scripts/vps/backup-vps.sh (or the installed copy).
  2. Obtain the exact new Titan Zero repository ZIP.
  3. Run the new release's scripts/vps/install-vps.sh with the same --app-domain,
     and install root. The installer preserves the shared environment/data,
     builds before migration, validates health/TLS, and only then moves current.

Example:
  sudo bash scripts/vps/install-vps.sh \
    --source /root/titan-zero.zip \
    --app-domain app.example.com
EOF

exit 2
