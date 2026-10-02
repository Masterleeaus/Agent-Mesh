#!/usr/bin/env python3
import argparse
import base64
import binascii
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "roadmap" / "SUBGOAL-ISSUE-MANIFEST.json"
GOALS_DIR = ROOT / "roadmap" / "goals"
SUBGOAL_RE = re.compile(r"^(TZ-[A-Z0-9]+(?:-[A-Z0-9]+)*)$")
BRANCH_RE = re.compile(r"^agent/issue-([1-9][0-9]*)$")
CANONICAL_GOAL_IDS = {"TZ-G00"} | {f"TZ-ROADMAP-{i:02d}" for i in range(1, 55)}


def fail(message: str) -> None:
    print(f"CLAIM-GATE ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def roadmap_files():
    paths = [MANIFEST, *GOALS_DIR.glob('*.json')]
    return {str(path.relative_to(ROOT)): path.read_text(encoding='utf-8') for path in paths}


def load_manifest(files):
    try:
        manifest = json.loads(files['roadmap/SUBGOAL-ISSUE-MANIFEST.json'])
    except (KeyError, ValueError):
        fail('roadmap manifest missing or invalid JSON')
    if not isinstance(manifest, list):
        fail("roadmap/SUBGOAL-ISSUE-MANIFEST.json must be a JSON array")
    return manifest


def validate_roadmap_integrity(files=None):
    files = roadmap_files() if files is None else files
    manifest = load_manifest(files)
    seen = {}
    errors = []

    for item in manifest:
        if not isinstance(item, dict):
            errors.append('manifest entries must be objects')
            continue
        sid = item.get("subgoal_id")
        gid = item.get("goal_id")
        if not isinstance(sid, str) or not SUBGOAL_RE.match(sid):
            errors.append(f"invalid subgoal_id in manifest: {sid!r}")
            continue
        if gid not in CANONICAL_GOAL_IDS:
            # Ignore stale/non-canonical manifest rows. Canonical roadmap authority is
            # the goal-file set below; historical Agent Mesh claims must not expand it.
            continue
        if sid in seen:
            errors.append(f"duplicate manifest subgoal_id: {sid}")
        seen[sid] = item

        goal_path = GOALS_DIR / f"{gid}.json"
        if str(goal_path.relative_to(ROOT)) not in files:
            errors.append(f"missing goal file for {sid}: {goal_path.relative_to(ROOT)}")
            continue

        try:
            goal = json.loads(files[str(goal_path.relative_to(ROOT))])
            if not isinstance(goal, dict) or not isinstance(goal.get("subgoals", []), list):
                raise ValueError("goal must be an object with a subgoals array")
        except Exception as exc:
            errors.append(f"invalid JSON in {goal_path.relative_to(ROOT)}: {exc}")
            continue

        goal_ids = {
            sg.get("subgoal_id")
            for sg in goal.get("subgoals", [])
            if isinstance(sg, dict)
        }
        if sid not in goal_ids:
            goal_status = str(goal.get("status") or "").upper()
            item_status = str(item.get("status") or "").upper()
            historical_only = (
                goal_status == "SUPERSEDED"
                and item_status in {"SUPERSEDED", "SUPERSEDED_BY_ARCHITECTURE"}
            )
            if not historical_only:
                errors.append(
                    f"{sid} exists in issue manifest but not in {goal_path.relative_to(ROOT)}"
                )

    goal_file_ids = set()
    for filename in files:
        if not re.fullmatch(r"roadmap/goals/[^/]+\.json", filename):
            continue
        path = ROOT / filename
        try:
            goal = json.loads(files[filename])
            if not isinstance(goal, dict):
                raise ValueError("goal must be an object")
        except Exception as exc:
            errors.append(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")
            continue
        gid = goal.get("goal_id")
        if not gid:
            errors.append(f"goal file missing goal_id: {path.relative_to(ROOT)}")
            continue
        if gid in goal_file_ids:
            errors.append(f"duplicate goal_id across goal files: {gid}")
        goal_file_ids.add(gid)

    expected_goal_ids = CANONICAL_GOAL_IDS
    missing_goals = sorted(expected_goal_ids - goal_file_ids)
    extra_goals = sorted(goal_file_ids - expected_goal_ids)
    if missing_goals:
        errors.append(f"missing canonical goal files: {', '.join(missing_goals)}")
    if extra_goals:
        errors.append(f"unexpected goal files: {', '.join(extra_goals)}")

    if errors:
        for error in errors:
            print(f" - {error}", file=sys.stderr)
        fail(f"roadmap integrity failed with {len(errors)} error(s)")

    print(
        f"Roadmap integrity OK: {len(goal_file_ids)} goals, "
        f"{len(seen)} canonical manifest subgoals."
    )
    return seen


def run_json(args):
    proc = subprocess.run(args, text=True, capture_output=True)
    if proc.returncode != 0:
        fail((proc.stderr or proc.stdout or "command failed").strip())
    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        fail(f"expected JSON from {' '.join(args)}: {exc}")


def meaningful(value):
    """Reject empty/template values; meaning and sufficiency remain human review."""
    return (isinstance(value, str) and bool(value.strip())
            and not re.fullmatch(r"(?i)(?:tbd|todo|n/?a|none|pending|unknown|\.\.\.|<[^>]*>)", value.strip()))


def missing_agent_pr_structure(body: str):
    sections = ["Outcome", "Files changed", "Verification", "Architecture / authority",
                "Completion evidence", "Risk / compatibility / rollback"]
    missing = []
    if "## Titan Zero Agent / Codex PR" not in body:
        missing.append("## Titan Zero Agent / Codex PR")
    for name in sections:
        match = re.search(r"(?m)^### " + re.escape(name) + r"\s*\n(.*?)(?=^#{1,3} |\Z)", body, re.S)
        if not match or not meaningful(match.group(1)):
            missing.append("### " + name)
    for field in ("Linked issue", "Claim branch"):
        if not re.search(r"(?m)^\*\*" + field + r":\*\*\s*\S", body):
            missing.append("**" + field + ":**")
    return missing


def issue_requirements(body):
    """Extract items/prose under supported issue headings, in source order.

    The full-body digest also catches changes outside these headings. This is a
    deliberately narrow format parser, never a semantic completion classifier.
    """
    names = {"acceptance", "acceptance criteria", "behavioral acceptance", "required outcomes",
             "required implementation", "done", "done condition", "verification"}
    requirements, current = [], []
    level = None
    has_acceptance = False
    def flush():
        if current:
            requirements.append(" ".join(" ".join(current).split()))
            current.clear()
    for line in body.splitlines():
        heading = re.match(r"^(#{1,6})\s+(.+?)\s*#*\s*$", line)
        if heading:
            name = re.sub(r'[*_`]', '', heading.group(2)).casefold().strip().rstrip(':').strip()
            name = re.sub(r'\s*\(required\)$', '', name).strip()
            if name in names:
                flush()
                level = len(heading.group(1))
                has_acceptance = has_acceptance or name != 'verification'
            elif re.search(r'\b(?:acceptance|done|required outcomes|required implementation)\b', name):
                fail('unrecognized acceptance/Done heading; clarify the issue format or use Refs')
            elif level is not None and len(heading.group(1)) <= level:
                flush()
                level = None
            elif level is not None:
                flush()
            continue
        if level is None:
            continue
        item = re.match(r"^\s*(?:[-*+] |[0-9]+[.)] )(?:\[[ xX]\] )?(.*)$", line)
        if item:
            flush()
            current.append(item.group(1).strip())
        elif not line.strip():
            flush()
        else:
            current.append(line.strip())
    flush()
    return requirements if has_acceptance else []


def closing_targets(body, repo):
    # Inspect the entire raw body conservatively, including code/comments: a
    # hidden/example closing directive is not an acceptable way to leave it open.
    target = r"(?:https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/issues/[1-9][0-9]*|(?:[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)?#[1-9][0-9]*)"
    pattern = r"(?i)\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\b\s*:?\s*(" + target + r"(?:\s*(?:,|and)\s*" + target + r")*)"
    found = []
    for match in re.finditer(pattern, body):
        for reference in re.findall(target, match.group(1)):
            if reference.startswith('https://'):
                parts = reference.split('/')
                owner_repo, number = '/'.join(parts[3:5]), parts[-1]
            elif reference.startswith('#'):
                owner_repo, number = repo, reference[1:]
            else:
                owner_repo, number = reference.split('#')
            found.append((owner_repo.casefold(), int(number)))
    return found


def validate_completion_evidence(body, issue, issue_number, relation):
    blocks = re.findall(r"(?m)^```mission-evidence[ \t]*\r?\n(.*?)^```[ \t]*$", body, re.S)
    if len(blocks) != 1:
        fail("include exactly one fenced mission-evidence JSON record")
    def unique_keys(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                fail(f"duplicate evidence key {key!r}")
            result[key] = value
        return result
    try:
        evidence = json.loads(blocks[0], object_pairs_hook=unique_keys)
    except (ValueError, TypeError):
        fail("mission-evidence must be valid JSON")
    if not isinstance(evidence, dict) or type(evidence.get('version')) is not int or evidence['version'] != 1:
        fail("mission-evidence version must be 1")
    if type(evidence.get('issue')) is not int or evidence['issue'] != issue_number:
        fail("evidence issue must match the claim/link")
    mode = evidence.get('mode')
    if not isinstance(mode, str) or mode not in {'complete', 'partial'} or (relation == 'Closes') != (mode == 'complete'):
        fail("Closes requires complete evidence; partial slices must use Refs")
    if evidence.get('human_review_required') is not True:
        fail("human_review_required must be true; format validation cannot certify completion")
    issue_body = issue.get('body') or ''
    if relation == 'Closes' and evidence.get('issue_body_sha256') != hashlib.sha256(issue_body.encode('utf-8')).hexdigest():
        fail("closing evidence issue digest changed or is missing; re-read the full live issue and update evidence")
    criteria, checks = evidence.get('criteria'), evidence.get('checks')
    remaining, live = evidence.get('remaining_work'), evidence.get('live_host')
    if not isinstance(criteria, list) or not isinstance(checks, list) or not isinstance(remaining, list):
        fail("criteria, checks and remaining_work must be arrays")
    if not all(meaningful(item) for item in remaining):
        fail("remaining_work must contain concrete descriptions")
    if not isinstance(live, dict) or not isinstance(live.get('status'), str) or live.get('status') not in {'passed', 'not-required', 'not-run', 'blocked', 'unknown'} or not meaningful(live.get('reason')):
        fail("live_host requires an explicit status and reason")
    check_by_id = {}
    for check in checks:
        if not isinstance(check, dict) or not all(meaningful(check.get(field)) for field in ('id', 'command', 'evidence')):
            fail("each check needs an id, exact command/observation and concrete result evidence")
        if check['id'] in check_by_id or type(check.get('required')) is not bool:
            fail("check ids must be unique and required must be boolean")
        if not isinstance(check.get('result'), str) or not isinstance(check.get('kind'), str) or check.get('result') not in {'passed', 'failed', 'blocked', 'not-run', 'unknown'} or check.get('kind') not in {'automated', 'manual', 'live-host'}:
            fail("check result/kind is invalid")
        check_by_id[check['id']] = check
    seen = []
    for criterion in criteria:
        if not isinstance(criterion, dict) or not meaningful(criterion.get('criterion')):
            fail("each criterion needs its exact issue text")
        paths, references = criterion.get('implementation'), criterion.get('checks')
        if not isinstance(paths, list) or not paths or not all(meaningful(path) for path in paths):
            fail("each criterion needs concrete implementation paths")
        if not isinstance(references, list) or not references or not all(isinstance(ref, str) and ref in check_by_id for ref in references):
            fail("each criterion must reference declared executed check records")
        seen.append(criterion['criterion'])
    if len(set(seen)) != len(seen):
        fail("duplicate criterion mappings are not completion evidence")
    if mode == 'partial':
        if not remaining:
            fail("partial slices must identify remaining mission work")
        return
    expected = issue_requirements(issue_body)
    if not expected or set(seen) != set(expected):
        fail("closing evidence must map every live issue acceptance/required outcome/Done/verification item exactly; use Refs if scope cannot be parsed or is incomplete")
    if remaining or not checks or any(check['result'] != 'passed' for check in checks):
        fail("remaining work or failed/blocked/unknown/unrun verification requires non-closing Refs")
    if live['status'] not in {'passed', 'not-required'}:
        fail("unverified live-host checks require non-closing Refs")
    live_checks = [check for check in checks if check['kind'] == 'live-host']
    if live['status'] == 'passed' and not live_checks:
        fail("live_host passed requires a passed live-host check record")
    if live['status'] == 'not-required' and live_checks:
        fail("not-required live_host contradicts declared live-host checks")


def flatten_pages(pages):
    return [item for page in pages for item in page] if pages and isinstance(pages[0], list) else pages


def validate_candidate_roadmap(repo, number, pr):
    """Overlay changed JSON blobs as data; never checkout or execute PR code."""
    changed = flatten_pages(run_json(['gh', 'api', '--paginate', '--slurp',
                                      f'repos/{repo}/pulls/{number}/files?per_page=100']))
    count = pr.get('changed_files')
    if type(count) is not int or len(changed) != count:
        fail('PR file listing incomplete or changed during validation; cannot verify roadmap')
    files, touched = roadmap_files(), False
    def relevant(path):
        return path == 'roadmap/SUBGOAL-ISSUE-MANIFEST.json' or bool(
            isinstance(path, str) and re.fullmatch(r'roadmap/goals/[A-Za-z0-9_.-]+\.json', path))
    for entry in changed:
        path, previous = entry.get('filename'), entry.get('previous_filename')
        if entry.get('status') == 'renamed' and relevant(previous):
            files.pop(previous, None)
            touched = True
        if not relevant(path):
            continue
        touched = True
        if entry.get('status') == 'removed':
            files.pop(path, None)
            continue
        sha = entry.get('sha')
        if not isinstance(sha, str) or not re.fullmatch(r'[0-9a-f]{40}', sha):
            fail('changed roadmap file has no immutable blob SHA')
        blob = run_json(['gh', 'api', f'repos/{repo}/git/blobs/{sha}'])
        if blob.get('encoding') != 'base64' or not isinstance(blob.get('content'), str):
            fail('roadmap blob is not supported base64 data')
        try:
            data = base64.b64decode(''.join(blob['content'].split()), validate=True)
            # Bind the API content to the requested immutable Git blob identity.
            actual = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
            if actual != sha:
                fail('roadmap blob content does not match its immutable SHA')
            files[path] = data.decode('utf-8')
        except (ValueError, UnicodeError, binascii.Error):
            fail('roadmap blob has invalid encoding')
    if touched:
        validate_roadmap_integrity(files)


def linked_closing_issues(repo, number):
    """Read manual/body-linked closing issues, including all GraphQL pages."""
    owner, name = repo.split('/', 1)
    query = """query($owner: String!, $name: String!, $number: Int!, $cursor: String) {
      repository(owner: $owner, name: $name) {
        pullRequest(number: $number) {
          closingIssuesReferences(first: 100, after: $cursor) {
            nodes { number repository { nameWithOwner } }
            pageInfo { hasNextPage endCursor }
          }
        }
      }
    }"""
    result, cursor, cursors = [], None, set()
    while True:
        args = ['gh', 'api', 'graphql', '-f', f'query={query}', '-f', f'owner={owner}',
                '-f', f'name={name}', '-F', f'number={number}']
        if cursor:
            args += ['-f', f'cursor={cursor}']
        response = run_json(args)
        if response.get('errors'):
            fail('cannot verify linked closing issues: GraphQL errors')
        try:
            connection = response['data']['repository']['pullRequest']['closingIssuesReferences']
            for issue in connection['nodes']:
                result.append((issue['repository']['nameWithOwner'].casefold(), int(issue['number'])))
            page = connection['pageInfo']
            if not page['hasNextPage']:
                return result
            cursor = page['endCursor']
            if not isinstance(cursor, str) or not cursor or cursor in cursors:
                fail('invalid closing issue pagination cursor')
            cursors.add(cursor)
        except (KeyError, TypeError, ValueError):
            fail('cannot verify linked closing issues: invalid GitHub response')


def validate_pull_request():
    validate_roadmap_integrity()
    event_path = os.environ.get('GITHUB_EVENT_PATH')
    repo, token = os.environ.get('GITHUB_REPOSITORY'), os.environ.get('GH_TOKEN')
    if not event_path or not repo or not token:
        fail("GITHUB_EVENT_PATH/GITHUB_REPOSITORY/GH_TOKEN unavailable")
    event = json.loads(Path(event_path).read_text(encoding='utf-8'))
    number = (event.get('pull_request') or {}).get('number') or event.get('number')
    if type(number) is not int or number < 1:
        fail("pull request number unavailable")
    # Re-read live PR metadata and complete commit/file listings so hidden close
    # directives cannot bypass the mission-closure check.
    pr = run_json(['gh', 'api', f'repos/{repo}/pulls/{number}'])
    validate_candidate_roadmap(repo, number, pr)
    commits = flatten_pages(run_json(['gh', 'api', '--paginate', '--slurp',
                                      f'repos/{repo}/pulls/{number}/commits?per_page=100']))
    if type(pr.get('commits')) is not int or len(commits) != pr['commits']:
        fail('PR commit listing incomplete or changed; cannot determine whether it closes a mission')
    closing_text = '\n'.join([pr.get('title') or '', pr.get('body') or ''] +
                               [(commit.get('commit') or {}).get('message') or '' for commit in commits])
    targets = set(closing_targets(closing_text, repo) + linked_closing_issues(repo, number))

    # Partial and ordinary slice PRs are mergeable code deliveries. Full mission
    # evidence is checked only when GitHub will close an issue on merge.
    if not targets:
        print('Slice merge gate passed: PR does not close a mission; product completion is not asserted.')
        return
    if len(targets) != 1:
        fail('a mission-closing PR must close exactly one issue')
    target_repo, issue_number = next(iter(targets))
    if target_repo != repo.casefold():
        fail('mission-closing PR must close an issue in this repository')
    if (pr.get('base') or {}).get('ref') != 'main':
        fail('mission-closing PR must target main')
    if ((pr.get('head') or {}).get('repo') or {}).get('full_name', '').casefold() != repo.casefold():
        fail('mission-closing PR must use a branch from this repository')
    if pr.get('number') != number or pr.get('state') == 'closed':
        fail('mission-closing PR metadata changed during validation')

    body = pr.get('body') or ''
    missing = missing_agent_pr_structure(body)
    if missing:
        fail('mission-closing PR body is missing evidence structure: ' + ', '.join(missing))
    link = re.findall(r'(?m)^\*\*Linked issue:\*\*[ \t]*Closes #([1-9][0-9]*)[ \t]*$', body)
    if len(link) != 1 or int(link[0]) != issue_number:
        fail('mission-closing PR must link exactly the issue it closes')
    issue = run_json(['gh', 'api', f'repos/{repo}/issues/{issue_number}'])
    if 'pull_request' in issue or issue.get('state') != 'open':
        fail('linked mission must be an open issue, not a pull request')
    validate_completion_evidence(body, issue, issue_number, 'Closes')
    issue_now = run_json(['gh', 'api', f'repos/{repo}/issues/{issue_number}'])
    if issue_now.get('body') != issue.get('body') or issue_now.get('state') != 'open':
        fail('issue changed during validation; refresh the closure evidence and retry')
    print(f'Mission closure evidence is structurally complete for #{issue_number}; human semantic review remains required.')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        validate_roadmap_integrity()
        result = subprocess.run([sys.executable, '-m', 'unittest', 'discover', '-s',
                                 str(ROOT / '.github/scripts/tests'),
                                 '-p', 'test_validate_agent_claim.py', '-v'], check=False)
        raise SystemExit(result.returncode)
    validate_pull_request()


if __name__ == "__main__":
    main()
