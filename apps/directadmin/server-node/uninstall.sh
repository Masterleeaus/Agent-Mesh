#!/usr/bin/env bash
set -euo pipefail
if command -v systemctl >/dev/null 2>&1 && [ "$(id -u)" -eq 0 ]; then systemctl disable --now titan-server-node.service 2>/dev/null || true; systemctl daemon-reload; fi
printf '%s\n' '{"plugin":"titan-server-node","lifecycle":"uninstalled","control_metadata":"preserved_for_recovery","business_data":"untouched"}'
