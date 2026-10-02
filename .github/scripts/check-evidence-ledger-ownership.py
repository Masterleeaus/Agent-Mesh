#!/usr/bin/env python3
"""Require every active ledger-named source file to have an explicit role."""
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
INVENTORY = ROOT / "docs/contracts/evidence-ledger-ownership.json"
SOURCE_ROOTS = ("packages", "apps", "services")
EXTENSIONS = {".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"}
IGNORED_PARTS = {"archive", "ported", "imports", "node_modules", "tests", "test", "__tests__"}
IGNORED_SUFFIXES = (".test.js", ".test.jsx", ".test.mjs", ".test.cjs", ".test.ts", ".test.tsx", ".spec.js", ".spec.ts")


def active_ledger_sources():
    found = set()
    for root_name in SOURCE_ROOTS:
        root = ROOT / root_name
        for path in root.rglob("*"):
            if not path.is_file() or path.suffix not in EXTENSIONS or "ledger" not in path.stem.lower():
                continue
            relative = path.relative_to(ROOT)
            if any(part in IGNORED_PARTS for part in relative.parts):
                continue
            if path.name.lower().endswith(IGNORED_SUFFIXES):
                continue
            found.add(relative.as_posix())
    return found


def main():
    document = json.loads(INVENTORY.read_text())
    rows = document.get("inventory")
    if not isinstance(rows, list):
        raise ValueError("inventory must be an array")
    by_path = {}
    for row in rows:
        path = row.get("path")
        if not isinstance(path, str) or path in by_path:
            raise ValueError(f"missing or duplicate inventory path: {path!r}")
        if not (ROOT / path).is_file():
            raise ValueError(f"inventoried source does not exist: {path}")
        if not row.get("role") or not row.get("scope") or not row.get("durability"):
            raise ValueError(f"incomplete classification: {path}")
        by_path[path] = row

    sources = active_ledger_sources()
    missing = sorted(sources - by_path.keys())
    stale = sorted(by_path.keys() - sources)
    if missing or stale:
        if missing:
            print("Unclassified active ledger-named source files:", *missing, sep="\n  ", file=sys.stderr)
        if stale:
            print("Inventory entries no longer match active ledger-named sources:", *stale, sep="\n  ", file=sys.stderr)
        return 1
    accepted = [row["path"] for row in rows if row["role"] == "accepted-factual-history"]
    if accepted != [document.get("accepted_factual_owner")]:
        raise ValueError("exactly the declared accepted factual owner must hold that role")
    print(f"Evidence ledger ownership inventory is complete ({len(sources)} active ledger-named sources).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
