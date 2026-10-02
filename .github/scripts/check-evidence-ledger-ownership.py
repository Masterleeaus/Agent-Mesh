#!/usr/bin/env python3
"""Require active ledger-named and ownership-critical sources to be classified."""
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
INVENTORY = ROOT / "docs/contracts/evidence-ledger-ownership.json"
SOURCE_ROOTS = ("packages", "apps", "services")
EXTENSIONS = {".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"}
IGNORED_PARTS = {"archive", "ported", "imports", "node_modules", "tests", "test", "__tests__"}
IGNORED_SUFFIXES = (".test.js", ".test.jsx", ".test.mjs", ".test.cjs", ".test.ts", ".test.tsx", ".spec.js", ".spec.ts")
PERSISTENT_EVIDENCE_WRITES = re.compile(
    r"(?:(?:INSERT\s+INTO|UPDATE|CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?)\s+[\w.\"`-]*(?:evidence|ledger|facts?|receipt|verification|workflow_events|status_history|execution_lifecycle_(?:records|events))[\w.\"`-]*|"
    r"(?:evidenceSink|(?:persist|append|save|write)\w*(?:Evidence|Fact|Receipt))\s*[:=(])",
    re.IGNORECASE,
)


def active_evidence_sources(root=ROOT):
    found = set()
    for root_name in SOURCE_ROOTS:
        source_root = root / root_name
        for path in source_root.rglob("*"):
            if not path.is_file() or path.suffix not in EXTENSIONS:
                continue
            relative = path.relative_to(root)
            if any(part in IGNORED_PARTS for part in relative.parts):
                continue
            if path.name.lower().endswith(IGNORED_SUFFIXES):
                continue
            ledger_named = "ledger" in path.stem.lower()
            try:
                persistent_writer = bool(PERSISTENT_EVIDENCE_WRITES.search(path.read_text(errors="ignore")))
            except OSError:
                persistent_writer = False
            if ledger_named or persistent_writer:
                found.add(relative.as_posix())
    return found


PRIMARY_ROLES = {
    "accepted-factual-business-evidence-ledger",
    "execution-provider-receipt",
    "observed-verification-artifact",
    "restart-recovery-evidence",
    "derived-value-analytics",
    "simulation-counterfactual",
    "donor-history-compatibility",
}


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
        if row.get("role") not in PRIMARY_ROLES or not row.get("role_detail") or not row.get("scope") or not row.get("durability"):
            raise ValueError(f"incomplete or invalid primary-role classification: {path}")
        by_path[path] = row

    critical = document.get("ownership_critical_paths")
    if not isinstance(critical, list) or not critical or any(not isinstance(path, str) for path in critical):
        raise ValueError("ownership_critical_paths must be a non-empty array of repository paths")
    for path in critical:
        if not (ROOT / path).is_file():
            raise ValueError(f"ownership-critical source does not exist: {path}")
    for row in rows:
        consumers = row.get("consumers")
        if not isinstance(consumers, list) or any(not isinstance(path, str) or not (ROOT / path).is_file() for path in consumers):
            raise ValueError(f"consumer paths must exist and be listed as an array: {row['path']}")

    sources = active_evidence_sources() | set(critical)
    missing = sorted(sources - by_path.keys())
    stale = sorted(by_path.keys() - sources)
    if missing or stale:
        if missing:
            print("Unclassified active durable-evidence or ledger source files:", *missing, sep="\n  ", file=sys.stderr)
        if stale:
            print("Inventory entries no longer match active durable-evidence or ledger sources:", *stale, sep="\n  ", file=sys.stderr)
        return 1
    accepted = [row["path"] for row in rows if row["role"] == "accepted-factual-business-evidence-ledger"]
    if accepted != [document.get("accepted_factual_owner")]:
        raise ValueError("exactly the declared accepted factual owner must hold that role")
    print(f"Evidence ownership inventory is complete ({len(sources)} ledger-named, durable evidence-writer, or ownership-critical sources).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
