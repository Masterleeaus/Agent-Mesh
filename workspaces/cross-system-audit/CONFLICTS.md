# Cross-Agent Conflicts

## CONFLICT-001
Finding A: FINDING-CSA-006 (provisional)
Finding B: GitHub archaeology canonical-owner correction / issue #72 and #648
Disagreement:
Whether account_id evidence represents an unresolved target tenancy architecture or legacy/current Dovetails implementation requiring enforcement migration.

Evidence checked:
- packages/titan-platform/src/runtime.ts
- issue #72
- issue #648
- agent/765 CANONICAL-OWNER-MAP.md

Current code:
Titan Runtime uses company_id and normalizes compatibility tenant identifiers.

Resolution:
company_id is the target canonical invariant. account_id evidence is a legacy/current implementation concern, not justification for another tenancy abstraction. FINDING-CSA-006 is preserved but marked SUPERSEDED AS ARCHITECTURAL-GAP CLAIM.

Confidence: HIGH
Further work required:
Continue active-code boundary verification through the existing #648 lane; no duplicate issue.

## CONFLICT-002
Finding A: FINDING-GH-007 — no clear single Business Reality/Evolution owner during archaeology pass
Finding B: FINDING-CSA-011 — issue #767 exists for OnboardingPro Evolution and Reality convergence
Disagreement:
Timing/ownership, not underlying capability evidence.

Evidence checked:
- issue #767
- agent/765 STATUS/FINDINGS/CANONICAL-OWNER-MAP

Current code:
No conclusion here that #767 is implemented; it is an existing convergence action.

Resolution:
Treat #767 as the current action/ownership lane while retaining FINDING-GH-007 as historical evidence that the ownership gap existed during that archaeology pass. Do not create another Evolution/Reality issue.

Confidence: HIGH
Further work required:
Re-ingest GitHub and Library archaeology after their next checkpoints and independently verify P1 donor claims before finalization.
