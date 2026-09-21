#!/usr/bin/env python3
import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

ANSI_RE = re.compile(r"\x1b\[[0-9;]*m")
WORKER_FAIL_RE = re.compile(r"^FAIL\s+(.+?)\s*$")
WEB_FAIL_RE = re.compile(r"^×\s+(.+?)(?:\s+\d+ms)?\s*$")

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", required=True)
    parser.add_argument("--log", required=True)
    parser.add_argument("--command-status", required=True, type=int)
    parser.add_argument("--mode", required=True, choices=["web", "worker"])
    args = parser.parse_args()

    baseline = json.loads(Path(args.baseline).read_text(encoding="utf-8"))
    allowed = Counter({str(k): int(v) for k, v in baseline.get("allowed", {}).items()})
    current = Counter()

    for raw in Path(args.log).read_text(encoding="utf-8", errors="replace").splitlines():
        line = ANSI_RE.sub("", raw).strip()
        match = (WEB_FAIL_RE if args.mode == "web" else WORKER_FAIL_RE).match(line)
        if match:
            current[match.group(1).strip()] += 1

    if args.command_status != 0 and not current:
        print(
            f"{args.mode} tests failed but no named failures were parsed; treating this as a new harness failure.",
            file=sys.stderr,
        )
        return 1

    regressions = []
    for key, count in sorted(current.items()):
        limit = allowed.get(key, 0)
        if count > limit:
            regressions.append((key, count, limit))

    baseline_total = sum(allowed.values())
    current_total = sum(current.values())
    removed = sorted(key for key in allowed if current.get(key, 0) < allowed[key])

    print(
        f"{args.mode} test baseline: current={current_total}, baseline={baseline_total}, "
        f"failures={len(current)}/{len(allowed)}"
    )

    if removed:
        print("Baseline improvements detected:")
        for key in removed:
            print(f"  - {key}: {allowed[key]} -> {current.get(key, 0)}")

    if regressions:
        print("New/increased test failures:", file=sys.stderr)
        for key, count, limit in regressions:
            print(f"  - {key}: {count} > allowed {limit}", file=sys.stderr)
        return 1

    if args.command_status == 0:
        print(f"{args.mode} tests are fully clean; baseline can be deleted.")
    else:
        print(f"No {args.mode} test regression beyond the recorded Merge84 baseline.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
