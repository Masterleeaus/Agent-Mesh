# GitHub Archaeology Findings

## FINDING-GH-001

### Finding
The accessible GitHub account inventory contains 40 repositories, including multiple substantial Titan/Zero generations and related business/AI systems.

### Why it matters
Current default-branch inspection alone cannot represent roughly two years of development history.

### Evidence
- Repository owner: `Masterleeaus`
- Inventory artifact: `workspaces/github-archaeology/REPOSITORY-LEDGER.md`
- Notable repositories include `Titan-BOS`, `Titan-Zero`, `zero`, `TitanPro`, `Titancore`, `Titanzero`, `Titan-Builder`, `Interaction-engine`, `AI-Coding-Studio`, `Ai-extensions`, `clean`, `cleanly`, and `Agent-Mesh`.

### Current Titan equivalent
`Masterleeaus/Agent-Mesh` main is the current comparison baseline.

### Classification
HISTORICAL / PARTIAL

### Confidence
HIGH

### Related action
Continue staged repository → branch → history → capability archaeology under #765.

---

## FINDING-GH-002

### Finding
High-value historical repositories contain extensive branch-only development surfaces; several have dozens to 100+ branches.

### Why it matters
Important capabilities may never have reached repository default branches.

### Evidence
- Artifact: `workspaces/github-archaeology/BRANCH-LEDGER.md`
- `TitanPro`: 100+ observed
- `Ai-extensions`: 100+ observed
- `Titan-Builder`: 82 observed
- `Titancore`: 29
- `cleanly`: 29
- `Worksuite-Saas---Project-Management-System_Laravel`: 20
- `zero`: 18
- `Titan-BOS`: 18
- `AI-Coding-Studio`: 17

### Current Titan equivalent
No single equivalent; branch archaeology is evidence recovery.

### Classification
HISTORICAL / UNMERGED potential

### Confidence
HIGH

### Related action
#765.

---

## FINDING-GH-003

### Finding
Historical `Ai-extensions` branch `feature/wizard-answer-recomposition` implements revision-aware recomposition with explicit change events, answer revision checks, affected sections, source/confidence/risk/confirmation metadata, deterministic proposals and stale-context rejection.

### Why it matters
The mechanism is a strong precursor for Evolution-style change → reassess → propose → validate behavior without granting learning authority.

### Evidence
Repository: `Masterleeaus/Ai-extensions`
Branch: `feature/wizard-answer-recomposition`
Structural comparison at inspection: 26 commits ahead / 243 behind main.
Paths inspected:
- `app/extensions/WorkCore_Platform/packages/workcore-business-network/src/Domains/WorkCore/System/Modules/Wizards/Events/WizardAnswerChanged.php`
- `.../Services/WizardAnswerRecompositionService.php`
Related repository/contracts/tests recorded in `CAPABILITY-RECOVERY-MATRIX.md`.

### Current Titan equivalent
Partial overlap: #59 owns Decision temporal re-evaluation; #153 owns memory correction/supersession. No justification for a parallel wizard/evolution engine.

### Classification
HISTORICAL / PARTIAL / UNMERGED

### Confidence
HIGH

### Related action
Compare/converge missing semantics through #59/#153 rather than create a new subsystem.

---

## FINDING-GH-004

### Finding
Historical `Ai-extensions` branch `feature/titan-vertical-context-composer` contains layered context resolution with value-level provenance.

### Why it matters
It can inform the new requirement to keep authoritative Business Reality separate from inferred Personal Zero understanding and preserve source/confidence/confirmation/risk/revision.

### Evidence
Repository: `Masterleeaus/Ai-extensions`
Branch: `feature/titan-vertical-context-composer`
Structural comparison at inspection: 17 commits ahead / 266 behind main.
Paths inspected:
- `packages/titan-interaction-engine/src/Vertical/VerticalContextComposer.php`
- `packages/titan-interaction-engine/src/Vertical/DTO/ContextValueProvenance.php`

### Current Titan equivalent
#153 Business Memory/Knowledge and shared provenance/evidence contracts are the closest canonical owners; current Production Intelligence also has source-authority principles.

### Classification
SUPERIOR HISTORICAL semantics / PARTIAL current equivalent

### Confidence
HIGH

### Related action
Selective semantic comparison/port through existing canonical owners only.

---

## FINDING-GH-005

### Finding
Historical `feature/vertical-ai-proposal-bridge` explicitly treats model output as proposals, validates/sanitizes output, records model/provider and hashes, bounds attempts, and prevents AI output from claiming state application.

### Why it matters
It independently demonstrates an older implementation of the current invariant that intelligence does not create authority.

### Evidence
Repository: `Masterleeaus/Ai-extensions`
Branch: `feature/vertical-ai-proposal-bridge`
Structural comparison at inspection: 28 commits ahead / 244 behind main.
Path inspected:
- `packages/titan-interaction-engine/src/Vertical/AI/VerticalAIProposalBridge.php`

### Current Titan equivalent
Already covered architecturally by #642/#50/#153 and current AI/authority boundaries.

### Classification
HISTORICAL / DUPLICATE-PARTIAL

### Confidence
HIGH

### Related action
No new issue unless a concrete current implementation bypass is proven.

---

## FINDING-GH-006

### Finding
Experience Memory already has a strong canonical destination in current issue #153 rather than requiring a new parallel memory engine.

### Why it matters
#153 already specifies episodic memory from verified outcomes, provenance, freshness, confidence, correction/supersession, retention, privacy, anti-repeat behavior, harm/outcome learning, applicability and the rule that memory never grants authority.

### Evidence
Repository: `Masterleeaus/Agent-Mesh`
Issue: #153 — canonical company-scoped Business Memory & Knowledge runtime.
Related issues: #50, #59, #642.
Owner analysis: `CANONICAL-OWNER-MAP.md`.

### Current Titan equivalent
#153.

### Classification
CURRENT / SPECIFICATION ONLY or PARTIAL implementation pending issue evidence

### Confidence
HIGH for ownership; implementation completeness not asserted.

### Related action
Support #153; do not create duplicate Experience Memory issue.

---

## FINDING-GH-007

### Finding
The remaining pivot concepts without a clear single canonical owner are Personal Zero understanding, a general Business Reality model, and Evolution Engine orchestration.

### Why it matters
These are the areas where historical archaeology can still reveal missing reusable mechanisms without duplicating already-owned Trust, Decision, Memory, Rewind or Intelligence systems.

### Evidence
Open/closed issue searches plus owner reconciliation in `CANONICAL-OWNER-MAP.md`.
Existing owners found for adjacent concerns: #640/#761 Trust, #59 Decision, #153 Memory/Knowledge, #293 Rewind, #642 governed convergence, #725 continuity, #72 tenancy.

### Current Titan equivalent
Partial adjacent owners only.

### Classification
UNKNOWN / PARTIAL

### Confidence
MEDIUM-HIGH; further historical and current-code comparison required.

### Related action
Current archaeology phase under #765.
