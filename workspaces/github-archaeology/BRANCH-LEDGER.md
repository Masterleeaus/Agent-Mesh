# Branch Archaeology Ledger — Pass 2

Inventory date: 2026-09-22.

This pass enumerates branches for the first high-priority repository cohort. Branch names are evidence/navigation signals only; capability claims require tree/file/history inspection.

## High-priority branch inventory

| Repository | Branches observed | Initial lineage signals |
|---|---:|---|
| Titan-BOS | 18 | WorkCore cleaning merge, runtime infrastructure, CRM sync, Titan Zero rename/audit branches |
| Titan-Zero | 5 | Interaction Engine/PWA upgrades and merge84 verification |
| zero | 18 | TitanMesh exchange, Omni issues, WorkCore/MagicAI integration, FSM modules, historical audit |
| TitanPro | 100+ | Very large branch history; tenancy, panels, accounting, calling, CleaningJobs, ZeroPay, Nexus, quotes, studio, workflow/state-machine and UI work |
| Titancore | 29 | kernel normalisation, engine framework, platform manager, APIs, SDK, legacy AI consolidation, hardening |
| Titanzero | 2 | unzip/import lineage plus main |
| Titan-Builder | 82 | browser-first workflow, OpenBrowser, skill/tool/prompt libraries, bridge/auth/security, rollback, ChatGPT export |
| Interaction-engine | 2 | full engine template upgrade |
| AI-Coding-Studio | 17 | extension runtime, local bridge, native host, local-first repair, local AI development OS |
| Ai-extensions | 100+ | AI extension convergence, migration engine, vertical context, wizard/adaptation, Titan Hub/Nova/Reach, security and commerce |
| callingagent- | 5 | calling agent extraction/upgrade and chatbot completion |
| clean | 14 | knowledge layer, execution control, safety/governance, ChatGPT agent workflows |
| cleanly | 29 | Titan Go PWA, owner command centre, Zero node, AI/RAG stack, cleaning overlay, inventory/quality |
| Worksuite-Saas---Project-Management-System_Laravel | 20 | Titan agents, field ops, AI memory, accounting, mobile, Titan Zero workspace upgrade |
| INFINITY-AI | 1 | main only; repository-level capability scan required |
| Agent-Mesh | 64 | current claims plus historical convergence/setup/restore branches; current main remains comparison authority |

## Strong branch candidates for structural comparison

### Personal Zero / memory / learning
- `Worksuite.../copilot/integrate-aichatpromemory-v1-2`
- `clean/claude/phase-2-knowledge-layer`
- `clean/claude/chatgpt-agent-workflows-1pnvbm`
- `clean/claude/phase-3-execution-control`
- `clean/claude/phase-4-safety-governance`

### Evolution / configuration / vertical adaptation
- `Ai-extensions/feature/layered-wizard-question-composer`
- `Ai-extensions/feature/wizard-answer-recomposition`
- `Ai-extensions/feature/workcore-wizard-vertical-context`
- `Ai-extensions/feature/titan-vertical-context-composer`
- `Ai-extensions/feature/vertical-ai-proposal-bridge`
- `Ai-extensions/feat/titan-universal-migration-engine`

### Trust / authority / safety
- `clean/claude/phase-4-safety-governance`
- TitanPro organization/tenant ownership branches
- Titan-Builder identity, bridge-auth, containment and rollback branches

### Workforce / operations
- `Worksuite.../copilot/add-full-scaffold-for-titanagents`
- `Worksuite.../copilot/analyse-nexus-field-ops-app`
- `zero/copilot/merge-fsm-modules-fieldservice`
- `cleanly/copilot/add-titan-pro-owner-command-centre`
- `cleanly/copilot/add-pwa-setup-for-titan-go`

### Local/browser/private development lineage
- `AI-Coding-Studio/refactor/local-ai-development-os-pass2`
- `AI-Coding-Studio/integration/local-first-repair`
- `AI-Coding-Studio/agent-2/local-bridge-tooling`
- `Titan-Builder/implementation/browser-first-agent-workflow`
- `Titan-Builder/feature/openbrowser-workspace-tools`

### Core/runtime lineage
- `Titancore/copilot/implement-engine-framework`
- `Titancore/copilot/platform-kernel-normalisation`
- `Titancore/copilot/titan-core-legacy-ai-layer-consolidation`
- `Titan-BOS/copilot/implement-runtime-infrastructure-titan-zero`
- `Titan-Zero/agent/titan-zero-interaction-kernel-upgrade`
- `Interaction-engine/feature/full-engine-template-upgrade`

## Important finding

Branch archaeology materially changes the search space. Several repositories contain dozens to 100+ historical branches whose names indicate substantial functionality that cannot be evaluated from the current default branch alone. In particular, TitanPro, Ai-extensions, Titan-Builder, Titancore, zero, cleanly, Worksuite and AI-Coding-Studio require staged branch comparison.

## Guardrail

No branch listed here is yet classified as a donor, lost capability, regression source or superior implementation. Those classifications require comparison against both its repository default branch and current Titan Zero.

## Next pass

Perform structural/diff comparison on the strongest branch candidates rather than blindly deep-scanning every branch. Prioritize Personal Zero/memory/learning and Evolution mechanisms because the architectural pivot makes these high-information targets.
