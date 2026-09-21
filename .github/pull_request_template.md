## Titan Zero Agent Mesh V3 PR

Closes #

### Scope
- Roadmap subgoal:
- Actor:
- Complete pass delivered:

### Architecture checks
- [ ] `company_id` remains the sole canonical company boundary.
- [ ] Command Bus remains mutation authority.
- [ ] Device/privacy/cost-sovereignty rules are preserved.
- [ ] Canonical surfaces remain `zero`, `go`, `hub`.
- [ ] Titan Code is not introduced as a production runtime dependency.
- [ ] Existing canonical capability/workforce definitions were reused rather than duplicated.

### Verification
- [ ] Targeted tests
- [ ] Typecheck
- [ ] Build
- [ ] No merge-conflict markers
- [ ] No secrets or generated dependency folders committed

### Manager
Builders do not self-merge. Manager reviews diff + CI, then merges to `main`.
