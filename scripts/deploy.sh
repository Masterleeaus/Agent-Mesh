#!/usr/bin/env bash
# Legacy deployment entrypoint retained only to fail closed.
#
# The former implementation deployed directly to the historical "garonhome"
# host at /opt/business/ai-fsm/repo via deploy-garonhome.sh. That topology is
# NOT the canonical Titan Business Node architecture.
#
# Current deployment ownership:
#   #322 generic package/install/promote/rollback lifecycle
#   #812 Titan Server Node / DirectAdmin infrastructure provider
#   #1051 Frappe Business Engine provisioning/configuration
#
# Do not restore direct host assumptions here. Use the current commissioned
# deployment mechanism documented by those missions/current production config.
set -euo pipefail

cat >&2 <<'EOF'
ERROR: scripts/deploy.sh is a retired legacy deployment entrypoint.

It no longer deploys to garonhome or /opt/business/ai-fsm/repo.

Use the current Titan deployment path owned by #322/#812. Frappe Business
Engine provisioning is coordinated by #1051 through Server Node capabilities.
EOF
exit 64
