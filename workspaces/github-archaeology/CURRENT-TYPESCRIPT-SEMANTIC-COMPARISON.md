# Current TypeScript Semantic Comparison — Pass 4

## Scope

Compare the pivot-critical historical mechanisms found in Pass 3 against current `Masterleeaus/Agent-Mesh` `main` before declaring anything lost or importing donor code.

## Current implemented/canonical evidence

Current `main` is a TypeScript/pnpm system with `apps/web`, `services/worker`, `packages/domain`, PostgreSQL migrations and raw-SQL/RLS infrastructure.

The current canonical Production Intelligence document already establishes several important semantics:

- one authoritative understanding of work feeding multiple projections;
- AI never owns a source of truth;
- observed reality, required work, production assumptions, historical production and owner decisions have separate authoritative sources;
- AI may extract/normalize, assemble, apply and calibrate, but not silently replace those sources;
- missing source data should surface uncertainty rather than be silently filled by AI;
- historical completed work is intended to improve future estimates;
- confidence and reasons for uncertainty are explicit target concepts.

This means part of the architectural pivot is **semantically present** in current Titan Zero even though it is expressed through the narrower Dovetails/Production Intelligence model.

## Current gaps relative to the new pivot

The current canonical architecture remains centered on Dovetails FSM / residential handyman operations. Its primary model is Client → Property → Estimate → Job → Work Order → Visit → Invoice → History.

Targeted repository searches plus canonical-document inspection found no current named implementation/documentation for:

- Personal Zero as a persistent working-intelligence model;
- separate Understanding Memory;
- separate Experience Memory;
- Evolution Engine;
- Business Reality as a general business model distinct from Personal Zero;
- explicit experience tuple: context → decision → action → expected outcome → actual outcome → unintended effect → lesson → confidence → future applicability;
- a general revision-aware recomposition contract for changing personal/business understanding;
- the historical `VerticalContextComposer`, `ContextValueProvenance`, `WizardAnswerChanged`, or `WizardAnswerRecomposition` contracts.

This is stronger evidence than the earlier exact-name search, but still does not justify blindly importing the historical PHP implementation.

## Semantic overlap matrix

| Historical mechanism | Current semantic equivalent | Assessment |
|---|---|---|
| Value-level source provenance | PI has explicit authoritative-source rules | PARTIAL — policy is present; historical per-value provenance contract may be richer |
| Confidence/uncertainty | PI explicitly models confidence and missing-source uncertainty | PRESENT/PARTIAL depending implementation depth |
| AI proposes, source wins | Explicit current canonical PI rule | PRESENT |
| AI must not own authority | Owner remains final business decision in PI | PRESENT in PI scope |
| Historical-performance feedback | PI target model includes Historical Performance/calibration | PRESENT AS DIRECTION; implementation deliberately gated |
| Context hash / stale proposal rejection | No equivalent located in current canonical docs/search | CANDIDATE GAP |
| Answer revision / affected-section recomposition | No equivalent located | CANDIDATE GAP |
| Source type + confirmed + risk + revision per value | No general equivalent located | CANDIDATE GAP |
| Personal understanding model | No equivalent located | PIVOT GAP |
| Experience Memory | Historical performance is narrower, work-production-specific | PIVOT GAP |
| Business Reality vs Personal Zero separation | Current source-of-truth separation is useful precursor but not the same model | PIVOT GAP |
| Evolution continuous reassessment | No general equivalent located | PIVOT GAP |

## Important architecture warning

Current canonical documentation explicitly says its present scope is Dovetails and even lists “AI-first product repositioning” as out of scope until its existing phases stabilize. That is evidence of **documentation/product-direction lag relative to the newly supplied Titan Zero pivot**, not evidence that the old roadmap should override the new pivot.

The archaeology workspace must therefore continue to use current code as implemented truth while treating the supplied pivot as the target comparison model. It must not silently rewrite production architecture during archaeology.

## Tenant-boundary concern discovered

Current operational invariants say queries scope by `account_id` and current architecture says tables are account-scoped. The new Titan Zero architecture requires `company_id` as the only canonical tenant boundary.

This is a **material convergence concern**, but it is broad architectural work and must not be “fixed” from this archaeology branch. It should be verified against the newer Titan Zero implementation/history and any existing migration/convergence issues before creating another action.

## Recovery judgment after comparison

### Do not recover as parallel systems
- old Wizard system
- old Vertical Context architecture
- old PHP AI proposal engine

### Preserve/recover semantics for canonical-owner comparison
1. revision-aware change events;
2. affected-understanding recomposition;
3. deterministic context hashing / stale proposal rejection;
4. per-value provenance;
5. confidence + confirmation + risk + revision metadata;
6. AI proposal separation from state mutation;
7. deterministic fallback;
8. bounded/audited model attempts.

### New-pivot capabilities still needing an owner
1. Personal Zero understanding model;
2. Understanding Memory;
3. Experience Memory;
4. Business Reality ↔ Personal Zero boundary;
5. Evolution Engine reassessment loop.

## Conclusion

The historical branches are not simply obsolete. They contain concrete mechanisms that can strengthen the pivot. But current Titan Zero already has important source-authority, uncertainty and historical-calibration principles, so convergence should extend those canonical ideas rather than create another intelligence stack.

Next archaeology step: inspect current code and active issues for the canonical owners of trust/authority, decision, knowledge/provenance, reality/state and learning before any convergence action is created.
