#!/usr/bin/env python3
"""Validate fail-closed licensing provenance before a distribution is emitted."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
INVENTORY = ROOT / "docs/contracts/distribution-provenance.json"
AUDIT = ROOT / "docs/contracts/package-license-audit.json"
ALLOWED_STATES = {"approved", "blocked", "review_required", "not_present", "staging_only"}
SHA256 = set("0123456789abcdef")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def repository_path(root: Path, value: object) -> Path | None:
    if not isinstance(value, str) or not value or Path(value).is_absolute() or ".." in Path(value).parts:
        return None
    path = (root / value).resolve()
    if path != root.resolve() and root.resolve() not in path.parents:
        return None
    return path


def package_manifests(root: Path) -> list[dict]:
    candidates = [root / "package.json"]
    for top in ("apps", "packages", "services"):
        candidates.extend((root / top).rglob("package.json"))
    rows = []
    for path in sorted(set(candidates)):
        excluded = {"node_modules", "archive", ".next", "dist", "build", "coverage", ".test-dist"}
        if path.is_symlink() or not path.is_file() or any(part in excluded for part in path.relative_to(root).parts):
            continue
        try:
            data = json.loads(path.read_text())
        except (OSError, json.JSONDecodeError) as error:
            raise ValueError(f"invalid package manifest {path.relative_to(root)}: {error}") from error
        rows.append({
            "path": path.relative_to(root).as_posix(),
            "name": data.get("name"),
            "private": data.get("private") is True,
            "license": data.get("license", "NOASSERTION"),
            "sha256": sha256(path),
        })
    return rows


def archive_inputs(root: Path) -> list[dict]:
    archive_root = root / "archive"
    rows = []
    if not archive_root.is_dir():
        return rows
    suffixes = {".zip", ".tar", ".gz", ".tgz", ".7z", ".rar"}
    for path in sorted(item for item in archive_root.rglob("*") if item.is_file() and not item.is_symlink()):
        if path.suffix.lower() not in suffixes:
            continue
        rows.append({
            "path": path.relative_to(root).as_posix(),
            "bytes": path.stat().st_size,
            "sha256": sha256(path),
            "spdx": "NOASSERTION",
            "redistribution_state": "uninspected_archive_content",
        })
    return rows


def license_evidence_files(root: Path) -> list[dict]:
    search_roots = [root / name for name in ("apps", "packages", "services", "archive")]
    root_evidence = [path for path in root.iterdir() if path.is_file() and not path.is_symlink()
                     and (path.name.lower().startswith(("license", "licence", "copying"))
                          or "notice" in path.name.lower())
                     and path.suffix.lower() in {"", ".txt", ".md"}]
    excluded = {"node_modules", ".next", "dist", "build", "coverage", ".git"}
    rows = []
    candidates = list(root_evidence)
    for base in search_roots:
        if base.is_dir():
            candidates.extend(item for item in base.rglob("*") if item.is_file() and not item.is_symlink())
    for path in sorted(set(candidates)):
        if any(part in excluded for part in path.parts):
            continue
        name = path.name.lower()
        if not (name.startswith(("license", "licence", "copying"))
                or "notice" in name) or path.suffix.lower() not in {"", ".txt", ".md"}:
            continue
        text = path.read_text(errors="replace")[:2048]
        observed = "MIT" if "MIT License" in text else "NOASSERTION"
        rows.append({
            "path": path.relative_to(root).as_posix(),
            "bytes": path.stat().st_size,
            "sha256": sha256(path),
            "observed_spdx": observed,
            "rights_review": "required",
        })
    return sorted({row["path"]: row for row in rows}.values(), key=lambda row: row["path"])


def validate(root: Path, inventory: dict) -> list[str]:
    errors: list[str] = []
    if inventory.get("schema") != "titan-distribution-provenance/v1":
        errors.append("unsupported provenance inventory schema")
    policy = inventory.get("policy", {})
    if policy.get("unknown_rights") != "BLOCK_DISTRIBUTION":
        errors.append("unknown rights must block distribution")
    if policy.get("repository_license_decision") != "OWNER_DECISION_REQUIRED":
        errors.append("repository license must remain owner-decided")
    artifacts = inventory.get("artifacts")
    if not isinstance(artifacts, list):
        return errors + ["artifacts must be an array"]
    ids = [row.get("id") for row in artifacts if isinstance(row, dict)]
    if len(ids) != len(artifacts) or not all(isinstance(value, str) and value for value in ids) or len(ids) != len(set(ids)):
        errors.append("artifact ids must be unique strings")
    components = inventory.get("components", [])
    component_ids = [row.get("id") for row in components if isinstance(row, dict)]
    if len(component_ids) != len(components) or not all(isinstance(value, str) and value for value in component_ids) or len(component_ids) != len(set(component_ids)):
        errors.append("component ids must be unique strings")
    component_by_id = {row.get("id"): row for row in components
                       if isinstance(row, dict) and isinstance(row.get("id"), str)}
    for artifact in artifacts:
        if not isinstance(artifact, dict):
            continue
        artifact_id = artifact.get("id", "<missing>")
        state = artifact.get("distribution_state")
        if state not in ALLOWED_STATES:
            errors.append(f"{artifact_id}: invalid distribution_state")
            continue
        source_root = artifact.get("source_root")
        if source_root:
            path = repository_path(root, source_root)
            if path is None:
                errors.append(f"{artifact_id}: source_root escapes repository")
            elif not path.exists():
                errors.append(f"{artifact_id}: source_root does not exist")
        revision = artifact.get("source_revision")
        if revision is not None and (not isinstance(revision, str) or not re.fullmatch(r"[0-9a-f]{40}", revision)):
            errors.append(f"{artifact_id}: source_revision must be a full commit SHA")
        source_manifest = artifact.get("source_manifest")
        if source_manifest is not None:
            if not isinstance(source_manifest, dict) or not source_manifest.get("path"):
                errors.append(f"{artifact_id}: malformed source_manifest")
            else:
                source_path = repository_path(root, source_manifest["path"])
                expected = str(source_manifest.get("sha256", "")).lower()
                if not source_path or not source_path.is_file():
                    errors.append(f"{artifact_id}: source manifest missing")
                elif len(expected) != 64 or sha256(source_path) != expected:
                    errors.append(f"{artifact_id}: source manifest hash is missing or stale")
        for lock in artifact.get("dependency_lockfiles", []):
            rel = lock.get("path") if isinstance(lock, dict) else None
            expected = str(lock.get("sha256", "")).lower() if isinstance(lock, dict) else ""
            lock_path = repository_path(root, rel)
            if not lock_path or not lock_path.is_file():
                errors.append(f"{artifact_id}: dependency lockfile missing: {rel}")
            elif len(expected) != 64 or sha256(lock_path) != expected:
                errors.append(f"{artifact_id}: dependency lockfile hash is missing or stale: {rel}")
        if state == "approved":
            if artifact.get("first_party_spdx") in (None, "", "NOASSERTION"):
                errors.append(f"{artifact_id}: approved artifact requires first-party SPDX")
            approval_ref = artifact.get("legal_approval_ref")
            approval_path = repository_path(root, approval_ref)
            if not approval_path or not approval_path.is_file():
                errors.append(f"{artifact_id}: approved artifact requires an owner decision record")
            else:
                try:
                    decision = json.loads(approval_path.read_text())
                    if decision.get("status") != "approved" or artifact_id not in decision.get("approved_artifacts", []):
                        errors.append(f"{artifact_id}: owner decision record does not approve this artifact")
                except (OSError, json.JSONDecodeError, AttributeError):
                    errors.append(f"{artifact_id}: owner decision record is invalid")
            if artifact.get("dependency_license_status") != "complete":
                errors.append(f"{artifact_id}: dependency license inventory is incomplete")
            revision = artifact.get("source_revision", "")
            if not isinstance(revision, str) or not re.fullmatch(r"[0-9a-f]{40}", revision):
                errors.append(f"{artifact_id}: approved artifact requires an exact source revision")
            source_manifest = artifact.get("source_manifest")
            if not isinstance(source_manifest, dict) or not source_manifest.get("path"):
                errors.append(f"{artifact_id}: approved artifact requires a source manifest")
            for component_id in artifact.get("component_ids", []):
                component = component_by_id.get(component_id)
                if not component or component.get("redistribution_state") != "approved":
                    errors.append(f"{artifact_id}: component is missing or not approved: {component_id}")
            if not artifact.get("first_party_license_file"):
                errors.append(f"{artifact_id}: approved artifact requires first-party license text")
            for rel in [artifact.get("first_party_license_file"), *artifact.get("notice_files", [])]:
                notice_path = repository_path(root, rel) if rel else None
                if rel and (not notice_path or not notice_path.is_file()):
                    errors.append(f"{artifact_id}: required notice/license file missing: {rel}")
            if not artifact.get("notice_files"):
                errors.append(f"{artifact_id}: approved artifact requires generated third-party notices")
    for component in components:
        if not isinstance(component, dict):
            errors.append("component entry must be an object")
            continue
        state = component.get("redistribution_state")
        if state not in ALLOWED_STATES:
            errors.append(f"{component.get('id', '<missing>')}: invalid redistribution_state")
        for evidence in component.get("local_evidence", []):
            rel = evidence.get("path")
            digest = evidence.get("sha256", "").lower()
            if not isinstance(rel, str) or not rel or not isinstance(digest, str) or len(digest) != 64 or not set(digest) <= SHA256:
                errors.append(f"{component.get('id', '<missing>')}: malformed local evidence")
                continue
            path = repository_path(root, rel)
            if not path or not path.is_file():
                errors.append(f"{component.get('id', '<missing>')}: evidence file missing: {rel}")
            elif sha256(path) != digest:
                errors.append(f"{component.get('id', '<missing>')}: evidence hash changed: {rel}")
        if state == "approved":
            if component.get("spdx") in (None, "", "NOASSERTION"):
                errors.append(f"{component.get('id', '<missing>')}: approved component requires SPDX")
            if not component.get("source_ref") or not component.get("upstream_url"):
                errors.append(f"{component.get('id', '<missing>')}: approved component requires source URL and ref")
            upstream_hash = str(component.get("upstream_sha256", "")).lower()
            if len(upstream_hash) != 64 or not set(upstream_hash) <= SHA256:
                errors.append(f"{component.get('id', '<missing>')}: approved component requires exact upstream hash")
            notice_path = repository_path(root, component.get("notice_file"))
            if not notice_path or not notice_path.is_file():
                errors.append(f"{component.get('id', '<missing>')}: approved component requires a notice file")
    return errors


def generate_notices(root: Path, inventory: dict, artifact_id: str) -> str:
    artifact = next((row for row in inventory["artifacts"] if row.get("id") == artifact_id), None)
    if artifact is None:
        raise ValueError(f"unknown artifact: {artifact_id}")
    if artifact.get("distribution_state") != "approved":
        raise PermissionError(f"distribution blocked: {artifact_id} is {artifact.get('distribution_state')}")
    errors = validate(root, inventory)
    audit_path = root / "docs/contracts/package-license-audit.json"
    expected_audit = repository_audit(root)
    try:
        if not audit_path.is_file() or json.loads(audit_path.read_text()) != expected_audit:
            errors.append("package-license-audit.json is missing or stale")
    except (OSError, json.JSONDecodeError):
        errors.append("package-license-audit.json is missing or invalid")
    if errors:
        raise PermissionError("distribution provenance invalid: " + "; ".join(errors))
    chunks = ["THIRD-PARTY NOTICES", "", f"Artifact: {artifact_id}",
              f"First-party SPDX: {artifact['first_party_spdx']}", "",
              "--- First-party license ---",
              (root / artifact["first_party_license_file"]).read_text().rstrip(), ""]
    for rel in artifact["notice_files"]:
        chunks.extend([f"--- {rel} ---", (root / rel).read_text().rstrip(), ""])
    return "\n".join(chunks).rstrip() + "\n"


def repository_audit(root: Path) -> dict:
    return {
        "schema": "titan-repository-license-audit/v2",
        "manifests": package_manifests(root),
        "archive_inputs": archive_inputs(root),
        "license_evidence": license_evidence_files(root),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="validate inventory and package metadata report")
    parser.add_argument("--artifact", help="generate notices for an explicitly approved artifact")
    parser.add_argument("--output", type=Path, help="write generated notices to this path")
    parser.add_argument("--write-package-audit", action="store_true", help="refresh the checked-in package metadata audit")
    args = parser.parse_args()
    try:
        inventory = json.loads(INVENTORY.read_text())
        if args.write_package_audit:
            report = repository_audit(ROOT)
            AUDIT.write_text(json.dumps(report, indent=2) + "\n")
            print(f"wrote {AUDIT.relative_to(ROOT)} ({len(report['manifests'])} manifests)")
        errors = validate(ROOT, inventory)
        if args.write_package_audit and not args.check and not args.artifact:
            if errors:
                print("\n".join(errors), file=sys.stderr)
                return 1
            return 0
        if args.check:
            expected = repository_audit(ROOT)
            if not AUDIT.is_file() or json.loads(AUDIT.read_text()) != expected:
                errors.append("package-license-audit.json is missing or stale; refresh it after reviewing package metadata")
            if errors:
                print("\n".join(errors), file=sys.stderr)
                return 1
            print(f"provenance inventory valid; {len(expected['manifests'])} package manifests audited; unknown rights remain blocked")
            return 0
        if args.artifact:
            notice = generate_notices(ROOT, inventory, args.artifact)
            if args.output:
                args.output.write_text(notice)
            else:
                sys.stdout.write(notice)
            return 0
        if errors:
            print("\n".join(errors), file=sys.stderr)
            return 1
        parser.error("choose --check, --artifact, or --write-package-audit")
    except (OSError, json.JSONDecodeError, ValueError, PermissionError) as error:
        print(str(error), file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
