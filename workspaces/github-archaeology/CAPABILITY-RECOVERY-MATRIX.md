# Capability Recovery Matrix — Pass 3

## Scope

Structural comparison of the first pivot-critical historical branches, focused on mechanisms relevant to Personal Zero, persistent understanding, revision, and Evolution-style reassessment.

## Finding 1 — revision-aware context recomposition

**Evidence:** `Masterleeaus/Ai-extensions`, branch `feature/wizard-answer-recomposition`.

The branch is **diverged** from its repository main: 26 commits ahead / 243 behind. Its unique files include:

- `WizardAnswerChanged.php`
- `WizardAnswerRecompositionService.php`
- `WizardRecompositionRepositoryContract.php`
- `DatabaseWizardRecompositionRepository.php`
- `EnrichWizardAnswerProposal.php`
- dedicated recomposition tests

### Mechanism recovered

A changed answer emits an explicit event carrying:
- `company_id`
- actor
- answer revision
- affected sections
- source
- confidence
- risk
- confirmed state
- idempotency key

The recomposition service then:
1. rebuilds the current context snapshot,
2. rejects stale answer revisions,
3. records deterministic proposal drafts,
4. dispatches optional AI enrichment,
5. rejects stale AI proposals whose context hash no longer matches.

### Pivot relevance

This is strong historical evidence for a reusable **change → reassess affected understanding → propose revisions → validate against current state** pattern. It is highly relevant to the Evolution Engine and Personal Zero, but the old wizard implementation must not become a parallel Evolution or memory engine.

**Preliminary treatment:** CONVERGE semantics, not wholesale architecture.

**Confidence:** High.

---

## Finding 2 — layered context with per-value provenance

**Evidence:** `Masterleeaus/Ai-extensions`, branch `feature/titan-vertical-context-composer`.

The branch is **diverged**: 17 commits ahead / 266 behind. It adds a context composer, context layers, snapshots, provenance DTOs and tests.

### Mechanism recovered

The historical composer:
- orders context layers by precedence,
- resolves layered values,
- tracks provenance at leaf/value level,
- retains source type, confidence, confirmed state, risk and revision,
- separates constraints,
- creates deterministic context hashes,
- carries `company_id`, actor, approvals and unanswered items.

Historical source types include:
- system default
- vertical pack
- existing company data
- imported
- user entered
- AI extracted
- AI suggested

### Pivot relevance

This is directly useful to the new architecture's requirement that:
- Business Reality and Personal Zero remain distinct,
- inferred knowledge not silently overwrite authoritative reality,
- confidence/uncertainty/provenance remain visible,
- revised understanding can be traced to its source.

The implementation is PHP and tied to historical Interaction/vertical architecture, so the target should be semantics/contracts where current TypeScript lacks equivalent behavior.

**Preliminary treatment:** COMPARE current canonical provenance/context ownership, then selectively PORT/HARDEN missing semantics.

**Confidence:** High.

---

## Finding 3 — AI as proposal, not authority

**Evidence:** `Masterleeaus/Ai-extensions`, branch `feature/vertical-ai-proposal-bridge`.

The branch is **diverged**: 28 commits ahead / 244 behind.

### Mechanism recovered

The bridge:
- receives a hashed context snapshot,
- treats business values as untrusted data rather than instructions,
- validates and sanitizes model output,
- records provider/model identity plus prompt/response hashes,
- uses deterministic fallback after bounded attempts,
- explicitly restricts AI to proposals,
- does not permit AI output to claim that state was applied.

### Pivot relevance

This strongly aligns with the new invariant:

> learning/intelligence/recommendation does not create authority.

It also offers historical security and audit semantics useful for Zero/Evolution proposals.

**Preliminary treatment:** COMPARE against current Decision/Authority/AI proposal contracts; recover only missing guardrails.

**Confidence:** High.

---

## Finding 4 — layered wizard question composition

**Evidence:** `Masterleeaus/Ai-extensions`, branch `feature/layered-wizard-question-composer`.

The branch is **diverged**: 11 commits ahead / 241 behind and contains roughly 1,600 lines of unique/modified wizard planning/runtime/test code.

### Pivot relevance

Potential donor for progressive discovery and targeted questioning rather than static onboarding. This may support Evolution Engine discovery, but requires deeper inspection before classification because question composition alone is not Personal Zero learning.

**Preliminary treatment:** DEEP SCAN.

**Confidence:** Medium.

---

## Negative/important evidence

Historical `clean` branches:
- `claude/phase-2-knowledge-layer`
- `claude/phase-3-execution-control`
- `claude/phase-4-safety-governance`

are all **behind main with zero unique commits**. They are therefore not currently candidates for *unmerged branch recovery*. Their functionality may already have landed on that repository's main and should be evaluated there instead.

The Worksuite branch `copilot/integrate-aichatpromemory-v1-2` is diverged but reports one unique commit and no compare-file list from the connector. It remains unresolved and requires commit/tree inspection before making a capability claim.

---

## Current Titan Zero default-branch name search

A targeted search of current `Masterleeaus/Agent-Mesh` main found no exact matches for:
- `WizardAnswerChanged`
- `VerticalContextComposer`
- `ContextValueProvenance`
- `WizardAnswerRecomposition`
- `AIChatProMemory`
- “experience memory”
- “understanding memory”
- “recomposition”

This **does not prove the mechanisms are absent** because current Titan Zero may implement equivalent semantics under different names. Canonical-owner comparison is required before creating convergence issues.

---

## Pass conclusion

The first structural comparison has found genuinely valuable historical semantics, especially:

**revision-aware recomposition + value-level provenance + stale-context rejection + AI-proposal-without-authority.**

These mechanisms fit the architectural pivot unusually well and should be compared against the current TypeScript implementation before any import/port decision.
