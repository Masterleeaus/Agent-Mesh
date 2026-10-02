#!/usr/bin/env bash
# RETIRED LEGACY GARONHOME ENTRYPOINT
#
# Historical implementation is preserved in Git history. The garonhome /
# AI-FSM deployment topology is not the canonical Titan Business Node.
#
# Current owners:
#   #322 deployment/release/rollback
#   #812 Server Node infrastructure/provider mechanics
#   #1051 Frappe Business Engine provisioning where applicable
set -euo pipefail
echo "ERROR: backup-garonhome.sh is retired legacy infrastructure and must not be used for current Titan deployments." >&2
echo "Use the current #322/#812 deployment path and commissioned Business Node configuration." >&2
exit 64
