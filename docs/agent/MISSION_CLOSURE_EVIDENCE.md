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
the parent mission's semantic completion. Ordinary implementation steps stay in
the existing mission. If a small, independently executable remainder is blocked by
an external dependency, the bounded handoff process in root `AGENTS.md` may create
a successor issue that preserves every unmet requirement. This does not certify or
represent the original mission as fully delivered.

## PR relationship

Use the exact claim `agent/issue-N`, target `main`, and set the single metadata line
`**Linked issue:** Refs #N` while any mission requirement remains unproven.
The matching `**Claim branch:** agent/issue-N` is required. `Subgoal ID` is optional
planning traceability, never an implementation claim or a second issue owner.

Only a full mission candidate uses `**Linked issue:** Closes #N`. A blocked-work
handoff PR remains non-closing with `Refs #N` and `mode: partial`; it links the
successor issue and may not claim full delivery. After that slice merges, record
the linked handoff on the original issue and close it administratively. The gate rejects
extra closing targets, cross-repository closure, hidden closing directives in a
partial PR, obsolete/suffixed agent branches, forks impersonating the claim, a
closed/non-issue target, claim/head SHA drift, non-current-main ancestry and
another open PR owning/closing the same mission. A PR merely referencing the
mission from another exact claim is coordination, not a collision.

Closing directives are scanned conservatively even in code fences/comments.
Do not put example closing directives or unrelated closures in the PR body.
The gate also checks the PR title, all paginated commit messages, and GitHub's
GraphQL closing-issue links, including manually linked issues. Review these again
before merge: later GitHub changes or external/manual closure can invalidate a
previously green check; this workflow does not block direct issue-close actions.

## Machine-readable evidence version 1

Include exactly one fenced `mission-evidence` JSON block in the PR's
`### Completion evidence` section. Both PR templates carry the same example.
A partial record still needs the current issue digest, explicit live-host status,
remaining work and the human-review requirement. Criteria/checks may be empty
when no complete item can yet be evidenced; do not invent passed checks.

Fields:

- `version`: integer `1`
- `issue`: integer mission number matching the claim and linked issue
- `mode`: `partial` for `Refs`, or `complete` for `Closes`
- `issue_body_sha256`: SHA-256 of the entire current GitHub issue body encoded as
  UTF-8 without adding a trailing newline. Issue edits invalidate old evidence
- `criteria`: one object per criterion, with exact normalized `criterion` text,
  nonempty `implementation` paths, and `checks` containing declared check IDs
- `checks`: objects containing unique `id`, exact `command` or observation procedure,
  concrete `evidence` (result/output or durable run/artifact link), boolean
  `required`, `kind` (`automated`, `manual`, `live-host`), and `result`
  (`passed`, `failed`, `blocked`, `not-run`, `unknown`)
- `live_host`: `status` (`passed`, `not-required`, `not-run`, `blocked`, `unknown`)
  and concrete `reason`. `passed` requires a passed `live-host` check record;
  `not-required` must be justified and cannot contradict declared live-host checks
- `remaining_work`: concrete strings; empty only for a full mission candidate
- `human_review_required`: literal `true`; never a claim that review occurred

For full-completion closing records, every declared check must have run and passed.
Any failed, blocked, unknown or unrun check, outstanding live-host verification,
or remaining mission work keeps the PR non-closing. Placeholder paths/evidence do
not pass. A follow-up issue does not convert a partial PR into full-completion
evidence; it only enables the separate administrative handoff after merge.

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

## Blocked-work handoff and premature closure

For a bounded blocked-work handoff, follow the ordered procedure in root `AGENTS.md`:
create the successor first with all unmet requirements, merge the non-closing verified
slice on the existing claim branch, then record the handoff on and close the original
issue. The old issue remains historical scope; the successor owns the outstanding
implementation and verification. Never label the original fully delivered.

If an issue was closed without a successor or durable handoff record, reopen it when
authorized and possible, or create a linked follow-up preserving every unmet
requirement and explain the premature closure. Do not silently narrow history. Use
`SUPERSEDED` only when another outcome genuinely replaces the work.

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
