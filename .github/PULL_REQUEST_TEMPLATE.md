## Roadmap work
- Issue / subgoal:
- Branch:
- Goal:

## What changed
Describe the implementation completed in this PR.

## Evidence
- Tests/checks run:
- Relevant files/contracts:
- Remaining work, if any:

## Canonical architecture checks
- [ ] `company_id` remains the only canonical tenant boundary.
- [ ] Canonical surfaces remain `zero`, `go`, `hub`.
- [ ] Shared business logic lives in Core/shared runtimes, not duplicated in surfaces/adapters.
- [ ] Consequential mutations use governed execution / Command Bus.
- [ ] Existing canonical capability/agent identities were reused before creating new ones.
- [ ] Titan Code is not introduced as a Titan Zero production runtime dependency.
- [ ] This PR implements only remaining roadmap work and does not redo completed evidence.

Closes #
