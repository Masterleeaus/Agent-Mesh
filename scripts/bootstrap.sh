#!/usr/bin/env bash
# Legacy developer bootstrap retained fail-closed.
#
# The previous script unconditionally started the old PostgreSQL AI-FSM stack.
# That is not the canonical Titan Business Node development composition.
set -euo pipefail
cat >&2 <<'EOF'
ERROR: scripts/bootstrap.sh is a retired AI-FSM/PostgreSQL bootstrap.

Use the current development/runtime setup documented by #322/#812 and the
appropriate package-specific development commands. Business Engine/Frappe
development/provisioning is owned by #1051; do not recreate the old monolithic
PostgreSQL business database.
EOF
exit 64
