# FINDINGS

## FINDING-GH-001

### Finding
The repository's canonical execution contract establishes code/database migrations as implemented truth and `docs/canonical/` as authoritative product/architecture documentation; archive/generated material is evidence only.

### Why it matters
Mechanism-first archaeology must distinguish implemented evidence from historical donors and must not let historical planning documents silently become product instructions.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Branch: main
- Path: `AGENTS.md`
- Section: Documentation Hierarchy / Non-Negotiable Rules

### Current Titan equivalent
Repository governance via AGENTS.md and canonical documentation hierarchy.

### Classification
CURRENT

### Confidence
HIGH

### Related action
#763

---

## FINDING-GH-002

### Finding
No canonical `.titan/research/` directory or equivalent research workspace was found in the initial inspected repository paths, so this isolated specialist workspace was created rather than using another agent's workspace.

### Why it matters
The shared evidence workspace must remain isolated and durable so other agents can consume findings without relying on this chat.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Branch: main
- Inspected paths: `.titan`, `.titan/research`, `research`, `workspace`
- All were absent in the initial direct path inspection.

### Current Titan equivalent
N/A — coordination infrastructure.

### Classification
IMPLEMENTED

### Confidence
HIGH

### Related action
#763

---

## FINDING-GH-003

### Finding
The new archaeology lens explicitly treats mechanisms—not project names—as the primary discovery unit. Relevant mechanisms include personal understanding, behavioural understanding, experience memory, learning governors, decision support, persistent state, revision/rollback, observation, trust, reasoning, authority separation, reality understanding, and continuous evolution.

### Why it matters
A repository does not need to contain the word “Zero” to contain a valuable component for the persistent digital working intelligence.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Governing pivot supplied for this mission
- Required lens: “Could any part of this historical system contribute to the intelligence, memory, experience, learning, evolution, trust, reasoning, authority, reality understanding or operational capability of a person's Zero?”
- Pivot sections: mechanism-first archaeological question; do not overfit the search to “Zero”.

### Current Titan equivalent
The target future ownership model is Zero / Understanding Memory / Experience Memory / Learning Governor / Decision Intelligence / Persistent State / Rewind, plus Reality, Trust, Authority, and Evolution Engine.

### Classification
SPECIFICATION ONLY

### Confidence
HIGH

### Related action
#763

---

## FINDING-GH-004

### Finding
The pivot requires a strict separation between understanding, learning, recommendation, decision, and authority. Repeated behaviour must not silently become permission.

### Why it matters
Historical donor code that combines learning and authority requires architectural review even if its behaviour appears useful.

### Evidence
- Pivot supplied for this mission.
- Sections “LEARNING MUST NOT CREATE AUTHORITY” and “TRUST IS PART OF ZERO'S EVOLUTION”.
- Required distinction: Zero can learn that it normally approves a request; it must not infer authorization from that pattern.

### Current Titan equivalent
Titan Trust, Authority, Assurance, Governance and Command Bus remain separate authority controls.

### Classification
SPECIFICATION ONLY

### Confidence
HIGH

### Related action
#763; #761/#762

---

## FINDING-GH-005

### Finding
The archaeology Action is now implemented as a read-only GitHub workflow and searches current source plus reachable Git history by mechanism rather than by the word “Zero”.

### Why it matters
This turns the new pivot into a repeatable evidence-generation process and gives the final convergence agent a durable artifact rather than relying on chat context.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Branch: agent/763
- Path: `.github/workflows/titan-zero-mechanism-archaeology.yml`
- Commit: 0fec891a78279048c789aa6beaf5eaa486bf65ad
- PR: #764

### Current Titan equivalent
Read-only archaeology/evidence pipeline.

### Classification
IMPLEMENTED

### Confidence
HIGH

### Related action
#763

---

## FINDING-GH-006

### Finding
The current archaeology workflow explicitly flags implementations where learning/behaviour mechanisms and authority-separation mechanisms appear together for manual review.

### Why it matters
This is a targeted guard against the prohibited architectural shortcut in which learned behaviour becomes authority.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Branch: agent/763
- Path: `.github/workflows/titan-zero-mechanism-archaeology.yml`
- Logic: `learning_authority` review candidates.

### Current Titan equivalent
Titan Trust / Authority / Assurance / Governance boundary.

### Classification
IMPLEMENTED

### Confidence
HIGH

### Related action
#763

---

## UNVERIFIED / PROVISIONAL

The Action's heuristic output has not yet been inspected and promoted into source-level findings. Until source paths, symbols, revisions, and behaviour are manually verified, generated candidate rankings remain discovery evidence rather than architectural conclusions.


---

## FINDING-GH-007

### Finding
A separate open GitHub archaeology issue (#765) identifies `workspaces/github-archaeology/` as the workspace for a broader GitHub archaeology/convergence investigation. This specialist workspace remains intentionally separate because the workflow update prohibits taking over another agent's workspace.

### Why it matters
The repository now contains an explicit cross-agent workspace convention. The specialist mechanism archaeology work should remain isolated while referencing the broader archaeology workspace as supporting context rather than modifying it.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Issue: #765 — ARCHAELOGY: GitHub development history recovery workspace
- Issue text specifies: `workspaces/github-archaeology/`.
- Issue is separate from #763 and has a broader archaeology scope.

### Current Titan equivalent
Cross-agent research coordination boundary.

### Classification
CURRENT

### Confidence
HIGH

### Related action
#763

### Cross-agent note
Supports separation of specialist mechanism archaeology from the broader GitHub archaeology assignment. Do not modify #765's workspace unless its owner explicitly establishes a collaboration convention.

---

## FINDING-GH-008

### Finding
Issue #767 records verified OnboardingPro v6 donor components for Continuous Business Observation, Business Reality Graph, reconfiguration, Nexus reassessment/provisioning, discovery consent, outcome measurement and rollback/learning tests. These are relevant supporting evidence but belong to the Evolution/Reality convergence assignment rather than this mechanism-only implementation claim.

### Why it matters
It corroborates that the repository's active convergence backlog already contains concrete donor evidence and prevents this specialist issue from creating duplicate implementation work for those capabilities.

### Evidence
- Repository: Masterleeaus/Agent-Mesh
- Issue: #767 — [LIBRARY] Recover OnboardingPro Evolution and Reality capabilities
- Issue text names concrete donor paths and required convergence tests.

### Current Titan equivalent
Evolution Engine / Reality / Nexus ownership under existing convergence work.

### Classification
HISTORICAL

### Confidence
MEDIUM

### Related action
#759; #767

### Cross-agent note
Use as supporting evidence only. Do not duplicate the implementation assignment owned by #767.

---

## SUPERSESSION NOTE

FINDING-GH-002 remains accurate for the exact initial paths inspected, but it is superseded for repository-wide workspace discovery by FINDING-GH-007. A broader canonical archaeology workspace is now known to exist through issue #765; it is another agent's assigned workspace and therefore is not adopted here.
