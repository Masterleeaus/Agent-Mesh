#!/usr/bin/env python3
import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

ERROR_RE = re.compile(r"^(.*)\((\d+),(\d+)\): error (TS\d+): ")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", required=True)
    parser.add_argument("--log", required=True)
    args = parser.parse_args()

    baseline_path = Path(args.baseline)
    log_path = Path(args.log)

    baseline = json.loads(baseline_path.read_text(encoding="utf-8"))
    allowed = Counter({str(k): int(v) for k, v in baseline.get("allowed", {}).items()})

    current = Counter()
    for raw in log_path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw.strip()
        match = ERROR_RE.match(line)
        if not match:
            continue
        path, _line, _col, code = match.groups()
        current[f"{path}::{code}"] += 1

    regressions = []
    for key, count in sorted(current.items()):
        limit = allowed.get(key, 0)
        if count > limit:
            regressions.append((key, count, limit))

    baseline_total = sum(allowed.values())
    current_total = sum(current.values())
    removed = sorted(key for key in allowed if current.get(key, 0) < allowed[key])

    print(
        f"Web typecheck baseline: current={current_total}, "
        f"baseline={baseline_total}, pairs={len(current)}/{len(allowed)}"
    )

    if removed:
        print("Baseline improvements detected (safe to reduce baseline in follow-up):")
        for key in removed:
            print(f"  - {key}: {allowed[key]} -> {current.get(key, 0)}")

    if regressions:
        print("New/increased TypeScript errors:", file=sys.stderr)
        for key, count, limit in regressions:
            print(f"  - {key}: {count} > allowed {limit}", file=sys.stderr)
        return 1

    if current_total == 0:
        print("Web typecheck is clean; baseline can be deleted and strict typecheck enabled.")
    else:
        print("No TypeScript regression beyond the recorded Merge84 baseline.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
