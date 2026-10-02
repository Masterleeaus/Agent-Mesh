# Mission closure evidence

Root [AGENTS.md](../../AGENTS.md) owns claim, verification and completion rules.
This document specifies the format enforced by the existing
[claim gate](../../.github/scripts/validate-agent-claim.py); it is not another
mission tracker, runtime ledger or definition of authority.

## Scope and lifecycle

- **Planning/specification** establishes a design or contract. Its own issue may
  finish when its explicitly scoped specification outcome is accepted. A contract
  does not finish an implementation mission that consumes it.
- **Implementation** supplies the full runnable behavior, negative paths and tests
  required by its mission. Schemas, projections and documentation may be slices.
- **Integration** demonstrates that real canonical owners work together, including
  identity, authority, recovery and evidence at the relevant boundaries.
- **Certification** establishes the required observed results in the declared
  environment, including the commissioned live host when the mission requires it.

These are different issue outcomes, not automatic promotion states. A related
commit, green CI, provider acknowledgement or checked box alone proves none of
the parent mission's semantic completion. Split broad missions whenever a bounded,
independently reviewable outcome can ship; link the slices and keep the parent
open for product integration/certification.

## PR relationship

Partial and ordinary code PRs may use any short-lived branch name and merge with
focused checks. Use `Refs #N` to keep a parent issue open. The merge gate does not
require a claim branch, full parent checklist or full evidence record for a slice.

Only PRs that actually close an issue receive strict closure validation. GitHub
closing directives are scanned in the title, body, paginated commit messages and
linked-issue metadata. A closing PR must target `main`, point to one open issue in
this repository, and include the required full mission evidence. Non-closing PRs
remain eligible to merge without those completion conditions.

Review closure evidence again before merging: later GitHub changes or an external
issue-close action can invalidate a previous check. The workflow does not block
direct issue-close actions.

## Machine-readable evidence version 1

The `mission-evidence` JSON record is required only for a PR that closes an issue.
A partial PR may instead include a concise slice outcome, focused commands/results,
and links to remaining product-level work.

### Enumerating current acceptance

The parser extracts list items and prose paragraphs beneath `Acceptance`,
`Acceptance criteria`, `Behavioral acceptance`, `Required outcomes`,
`Required implementation`, `Done`, `Done condition`, and `Verification` Markdown
headings, normalizing whitespace and list/checklist markers. Common bold, trailing
colon and `(required)` heading variants are supported. Unrecognized acceptance/Done
headings fail closed; a Verification-only issue cannot claim full acceptance. Include all extracted
items exactly once in a closing record. Multiline item text is joined with spaces.
For issues without parseable requirements, retain `Refs` and have the issue owner
clarify its format without dropping scope. Requirements elsewhere in the issue
remain binding even when they are not mechanically extracted.

Fetch the current issue and calculate its digest without rewriting its body:

```sh
gh api repos/OWNER/REPO/issues/N > /tmp/mission-issue.json
python3 -c 'import hashlib,json; x=json.load(open("/tmp/mission-issue.json")); print(hashlib.sha256((x.get("body") or "").encode()).hexdigest())'
```

## Mandatory human review

A passing format check is **not approval to merge or close**. The human reviewer
must read the complete current issue and Done condition, compare every requirement
with actual implementation and executed evidence, and confirm:

1. Nothing was narrowed to a contract/schema/projection slice without an explicit
   scope decision by the mission owner
2. Paths/results are real and sufficient; tests exercise the promised behavior,
   not only fixtures, mocks or structure
3. Required integration, live-host, negative-path and recovery checks actually ran;
   `not-required` is justified by the issue rather than author convenience
4. Follow-ups preserve the original scope and do not disguise missing acceptance
5. The current PR body/head and issue still match the reviewed evidence

The trusted job has the unique stable check name **Mission Closure Evidence Gate**
so maintainers can configure it as a required status check without confusing it
with another workflow's `validate` job. Until an applicable repository rule makes
it required, a failing check is advisory and does not mechanically prevent merge.
Reviewer approval and required checks must be governed by repository settings;
this workflow does not modify branch protection, configure required checks or
grant merge authority. Configuring those settings requires separate authorization.
After issue edits or main advances, rerun the current PR gate (for example by
updating its evidence/body or synchronizing the branch) before merge. A stale green
check is not evidence for changed scope. `workflow_dispatch` runs policy self-tests,
not a substitute status certification for an individual PR.

## Safe execution and rollout

`Agent Claim Gate` uses `pull_request_target` with only contents/issues/PR **read**
permissions and checks out the trusted base SHA with credential persistence off.
It never checks out or executes PR-head code, downloads PR artifacts or evaluates
PR text as shell. GitHub API responses supply live claim/main/issue/PR facts. Changed roadmap JSON
blobs are read by immutable Git blob SHA and overlaid in memory for the existing
roadmap integrity checks, including deletion/renaming. PR code is never executed
in this path. Incomplete file listings fail closed, and a final PR metadata read
rejects concurrent head/body changes.
The separate `Mission Evidence Tests` job executes candidate regression tests only
on unprivileged `pull_request`, with no secrets or persisted credentials. Tests
replace only GitHub/process I/O; they exercise the real validation path.

On first rollout the old main policy may reject canonical `agent/issue-N`/`Refs`,
or the new trusted workflow may not yet be active. Record that deployment blocker,
keep the rollout PR draft/non-closing, and have maintainers review the candidate
suite and trusted-workflow activation. Never bypass branch protection, execute
candidate code in the trusted job, or claim live enforcement from local tests.
The workflow itself never writes to or closes an issue.

## Bounded blocked-work handoff

A small, separately executable remainder blocked outside the current branch may use
the handoff process in root `AGENTS.md`. The PR remains non-closing:
`**Linked issue:** Refs #N` with `mode: partial`. It links the successor issue and
records all unmet criteria, checks, live-host work and risks. This PR does not claim
the original mission is fully delivered.

Create the successor before closing the original. Copy every unmet requirement,
Done condition and verification item into that issue, name the blocker and canonical
owner, and link the predecessor and delivered PR. After the non-closing slice merges,
add a durable handoff record to the original issue identifying the merged change and
remaining scope, then close that issue administratively. Keep the successor open and
authoritative for the remainder. This handoff is not full-completion evidence and
does not relax the normal evidence gate for a PR that claims `complete`.

If a gate prevents the sequence, keep the original issue open and resolve the gate;
do not bypass branch protection. Do not use this procedure to move ordinary
implementation steps, avoid required tests/review, or narrow the original issue.

## Premature closure and supersession

Reopen a partially completed mission when authorized and possible. Add a durable
comment naming the premature closure/PR, what was actually delivered, the original
unmet criteria and the existing canonical implementation owner. If reopening is
not possible, create a linked implementation follow-up preserving every unmet
requirement and explaining the premature closure. Do not silently narrow history.
Use `SUPERSEDED` with a successor link only when another outcome genuinely replaces
this work; a contract milestone is not implementation completion.

## Regression evidence

The synthetic `september-28-plugin-mission.json` fixture reproduces the failure
shape without asserting that its sample paths/run links are real deployments:
a full installed plugin requires live certification, but a projection slice only
covers one item. Tests reject that slice as closing, accept it as explicit `Refs`,
and accept a fully mapped record as **format-valid only**. The same suite rejects
missing/duplicate criteria, issue drift, placeholders, unrun/live checks, extra
closures and ownership/ancestry violations.

```sh
python3 .github/scripts/validate-agent-claim.py --self-test
python3 -m unittest discover -s .github/scripts/tests -v
```
