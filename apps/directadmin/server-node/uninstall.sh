#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
test -f "$ROOT/update.sh" && [ ! -L "$ROOT/update.sh" ] || { echo "update.sh must be a regular file" >&2; exit 1; }
source "$ROOT/update.sh"

uninstall_report() {
  local lifecycle="$1" service="$2" enabled="$3" unit_present="$4" uninstalled=false retained='[]' enabled_json=null
  local retained_status=complete path_status index
  local -a retained_names=() paths=("$unit" "$runtime_path" "$token_path" "$state_path")
  local -a labels=(unit runtime token control_state)
  for index in "${!paths[@]}"; do
    path_status="$(server_node_path_presence "${paths[$index]}")" || path_status=unknown
    case "$path_status" in
      present) retained_names+=("\"${labels[$index]}\"") ;;
      absent) ;;
      *) retained_status=unknown ;;
    esac
  done
  retained="[$(IFS=,; printf '%s' "${retained_names[*]}")]"
  [ "$lifecycle" = uninstalled ] && uninstalled=true
  case "$enabled" in true|false) enabled_json="$enabled" ;; esac
  printf '{"plugin":"titan-server-node","lifecycle":"%s","uninstalled":%s,"service":"%s","enabled":%s,"retained":%s,"retained_status":"%s"}\n' \
    "$lifecycle" "$uninstalled" "$service" "$enabled_json" "$retained" "$retained_status"
}

server_node_path_presence() {
  local path="$1" parent="${1%/*}"
  if [ -e "$path" ] || [ -L "$path" ]; then
    printf 'present'
    return 0
  fi
  [ -n "$parent" ] || parent=/
  while [ "$parent" != / ] && [ ! -e "$parent" ] && [ ! -L "$parent" ]; do
    parent="${parent%/*}"
    [ -n "$parent" ] || parent=/
  done
  if [ -d "$parent" ] && [ -x "$parent" ]; then printf 'absent'; else printf 'unknown'; fi
}

uninstall_server_node() {
  local unit="$1" expected_owner="${2:-0}" runtime_path="${3:-/usr/local/titan/server-node}"
  local token_path="${4:-/etc/titan/server-node.env}" state_path="${5:-/var/lib/titan/server-node}"
  local load_state active_state unit_file_state unit_present=false
  [ "$(id -u)" = "$expected_owner" ] || { echo 'privileged Server Node uninstall required' >&2; uninstall_report uninstall-failed unknown unknown false; return 1; }
  command -v systemctl >/dev/null 2>&1 || { echo 'systemd is required to stop the Server Node service' >&2; uninstall_report uninstall-failed unknown unknown false; return 1; }
  if [ -L "$unit" ]; then
    echo 'refusing symlink Server Node service unit during uninstall' >&2
    uninstall_report uninstall-failed unknown unknown false
    return 1
  fi
  if [ -e "$unit" ]; then
    unit_present=true
    validate_server_node_existing_unit "$unit" "$expected_owner" || { uninstall_report uninstall-failed unknown unknown true; return 1; }
  fi

  load_state="$(systemctl show --property=LoadState --value titan-server-node.service 2>/dev/null)" || {
    echo 'unable to inspect Server Node service state' >&2
    uninstall_report uninstall-failed unknown unknown "$unit_present"
    return 1
  }
  if [ "$load_state" = not-found ]; then
    if [ "$unit_present" = true ]; then
      if ! systemctl daemon-reload; then
        echo 'systemd could not load the existing Server Node unit for uninstall' >&2
        uninstall_report uninstall-failed unknown unknown true
        return 1
      fi
      load_state="$(systemctl show --property=LoadState --value titan-server-node.service 2>/dev/null)" || {
        echo 'unable to inspect Server Node service state after reload' >&2
        uninstall_report uninstall-failed unknown unknown true
        return 1
      }
      if [ "$load_state" = not-found ]; then
        echo 'systemd did not load the existing Server Node unit; uninstall state is unverified' >&2
        uninstall_report uninstall-failed unknown unknown true
        return 1
      fi
    else
      uninstall_report uninstalled absent false false
      return 0
    fi
  fi

  if ! systemctl disable --now titan-server-node.service; then
    echo 'systemd could not disable and stop the Server Node service; recovery state was retained' >&2
    uninstall_report uninstall-failed unknown unknown "$unit_present"
    return 1
  fi
  active_state="$(systemctl show --property=ActiveState --value titan-server-node.service 2>/dev/null)" || {
    echo 'unable to verify the Server Node service stopped' >&2
    uninstall_report uninstall-failed unknown unknown "$unit_present"
    return 1
  }
  if [ "$active_state" != inactive ]; then
    echo 'Server Node service did not reach inactive state; recovery state was retained' >&2
    uninstall_report uninstall-failed "$active_state" unknown "$unit_present"
    return 1
  fi
  unit_file_state="$(systemctl show --property=UnitFileState --value titan-server-node.service 2>/dev/null)" || {
    echo 'unable to verify the Server Node service was disabled' >&2
    uninstall_report uninstall-failed inactive unknown "$unit_present"
    return 1
  }
  if [ "$unit_file_state" != disabled ]; then
    echo 'Server Node service is not confirmed disabled; recovery state was retained' >&2
    uninstall_report uninstall-failed inactive true "$unit_present"
    return 1
  fi
  uninstall_report uninstalled inactive false "$unit_present"
}

main() {
  local root
  root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  if [ "${1:-}" = "--validate-only" ] && [ "$#" -eq 1 ]; then
    validate_server_node_package "$root"
    printf '%s\n' '{"plugin":"titan-server-node","lifecycle":"validated","installation_attempted":false,"uninstalled":false,"mode":"validation-only"}'
    return 0
  fi
  [ "$#" -eq 0 ] || { echo 'usage: uninstall.sh [--validate-only]' >&2; return 2; }
  uninstall_server_node /etc/systemd/system/titan-server-node.service 0 \
    /usr/local/titan/server-node /etc/titan/server-node.env /var/lib/titan/server-node
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then main "$@"; fi
