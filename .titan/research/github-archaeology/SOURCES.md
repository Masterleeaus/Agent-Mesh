> Canonical shared multi-agent coordination copy. Detailed archaeology reports remain in `workspaces/github-archaeology/` until final consolidation.

# GitHub Archaeology Source Ledger

## SOURCE-GH-001
Repository: `Masterleeaus/Agent-Mesh`
Branch: `agent/765` / comparison baseline `main`
Commit: claim base `cb1ab5e507588ea35bb624a2a97ce22e04b4ac4c`
Path: `AGENTS.md`
Inspected: YES
Relevant findings: workflow/claim authority and architecture guardrails.
Notes: Operational coordination source, not historical capability evidence.

## SOURCE-GH-002
Repository: `Masterleeaus` account repository inventory
Branch: N/A
Commit: N/A
Path: account repository listing
Inspected: YES
Relevant findings: FINDING-GH-001
Notes: 40 repositories returned in complete paginated owner inventory.

## SOURCE-GH-003
Repository: multiple high-priority repositories
Branch: branch listings
Commit: branch heads as returned during Pass 2
Path: Git refs/branch metadata
Inspected: YES
Relevant findings: FINDING-GH-002
Notes: Branch names are navigation evidence, not capability proof.

## SOURCE-GH-004
Repository: `Masterleeaus/Ai-extensions`
Branch: `feature/wizard-answer-recomposition`
Commit: branch structurally compared against main during Pass 3
Path: `.../Wizards/Events/WizardAnswerChanged.php`
Inspected: YES
Relevant findings: FINDING-GH-003
Notes: Direct file inspection.

## SOURCE-GH-005
Repository: `Masterleeaus/Ai-extensions`
Branch: `feature/wizard-answer-recomposition`
Commit: branch structurally compared against main during Pass 3
Path: `.../Wizards/Services/WizardAnswerRecompositionService.php`
Inspected: YES
Relevant findings: FINDING-GH-003
Notes: Direct file inspection.

## SOURCE-GH-006
Repository: `Masterleeaus/Ai-extensions`
Branch: `feature/titan-vertical-context-composer`
Commit: branch structurally compared against main during Pass 3
Path: `packages/titan-interaction-engine/src/Vertical/VerticalContextComposer.php`
Inspected: YES
Relevant findings: FINDING-GH-004
Notes: Direct file inspection.

## SOURCE-GH-007
Repository: `Masterleeaus/Ai-extensions`
Branch: `feature/titan-vertical-context-composer`
Commit: branch structurally compared against main during Pass 3
Path: `packages/titan-interaction-engine/src/Vertical/DTO/ContextValueProvenance.php`
Inspected: YES
Relevant findings: FINDING-GH-004
Notes: Direct file inspection.

## SOURCE-GH-008
Repository: `Masterleeaus/Ai-extensions`
Branch: `feature/vertical-ai-proposal-bridge`
Commit: branch structurally compared against main during Pass 3
Path: `packages/titan-interaction-engine/src/Vertical/AI/VerticalAIProposalBridge.php`
Inspected: YES
Relevant findings: FINDING-GH-005
Notes: Direct file inspection.

## SOURCE-GH-009
Repository: `Masterleeaus/Agent-Mesh`
Branch: `main`
Path: `docs/canonical/ARCHITECTURE.md`, `DOMAIN_MODEL.md`, `PRODUCTION_INTELLIGENCE.md`, `WORKFLOW.md`, `ROADMAP.md`, `ai/INVARIANTS.md`
Inspected: YES
Relevant findings: current semantic comparison; source-authority and Dovetails scope evidence.
Notes: Canonical docs at time of inspection; code remains implemented truth.

## SOURCE-GH-010
Repository: `Masterleeaus/Agent-Mesh`
Branch: issue database/current main context
Path: Issues #153, #59, #50, #640, #761, #293, #642, #725, #72 and related issue search results
Inspected: YES
Relevant findings: FINDING-GH-006, FINDING-GH-007
Notes: Issue text establishes intended canonical ownership but does not by itself prove implementation completeness.

## Source relationship warning

Historical code may also exist in Library archives, ZIPs, copied repositories or merged branches. Such copies must not be counted as independent confirmations without lineage evidence.


## SOURCE-GH-026
Repository: `Masterleeaus/zero`
Commit: `61db48c38d990de010587144cfe601a4b487dd03`
Path/classes: TitanMemoryService, VectorMemoryAdapter, MemoryRecallTool, MemoryStoreTool, ProcessContract, SignalContract
Inspected: YES — commit diff
Relevant findings: FINDING-GH-010
Notes: Concrete memory/context implementation integrated with Signal/Rewind; same underlying repository lineage as later TitanMemory merge commit `9e3b764...`, so do not count both as independent evidence.

## SOURCE-GH-027
Repository: `Masterleeaus/zero`
Commit: `70e21c70ddb07ff69571bf616bfa19070c817e4c`
Path/classes: SiteAsset, AssetServiceEvent, InspectionInstance/Response/events, hazard/site-access/occupancy/service-plan/meter domain additions
Inspected: YES — commit diff
Relevant findings: FINDING-GH-011
Notes: Concrete company-scoped business-state/history mechanisms; evidence for compositional Business Reality.


- SOURCE-GH-011 — `Masterleeaus/Titancore` main, `TitanCore_V1.9/AI/Providers/provider.json`, SHA `c08a7d54639203d138776afca3e5422df785078e`; direct file inspection.
- SOURCE-GH-012 — `Masterleeaus/Titancore` main, `TitanCore_V1.9/Services/TitanCoreModelGateway.php`, SHA `f76ae50e96a3ace6ff02932557ccb47c6fc84a67`; direct file inspection.
- SOURCE-GH-013 — Agent-Mesh open issue #647, canonical Device/Distributed Intelligence Runtime + Cost Sovereignty owner; direct issue inspection.
- SOURCE-GH-014 — Agent-Mesh open issue #80, final Intelligence Runtime integration/certification owner; direct issue inspection.


- SOURCE-GH-015 — `Masterleeaus/TitanPro` main, `docs/04-AI/aegis-core.md`, SHA `8eeda3623ba7e65e8e8220950755a5da344220a1`; direct file inspection.
- SOURCE-GH-016 — `Masterleeaus/TitanPro` main, `docs/04-AI/orchestration.md`; direct file inspection for orchestration/convergence lineage.
- SOURCE-GH-017 — `Masterleeaus/cleanly` main, `docs/01-PWA/18-signal-envelope-and-event-backfeed-contract.md`, SHA `6dc757c77112efb9db5533915f08c8e0e428c33a`; direct file inspection.
- SOURCE-GH-018 — `Masterleeaus/cleanly` main, `docs/01-PWA/24-security-identity-device-trust-and-tenant-boundary.md`, SHA `8bf4e285832d00295f25bf4ddd2672147f238e20`; direct file inspection.
- SOURCE-GH-019 — Agent-Mesh #645 Edge Fabric and #302 security identity/credential hardening; direct open-issue inspection.


- SOURCE-GH-020 — `Masterleeaus/TitanPro` main, `config/titan_verticals.php`, SHA `627c0a60cf06e147677e4a1aa6d9254dfba61d22`; direct file inspection.
- SOURCE-GH-021 — `Masterleeaus/zero` main, ComplianceIQ `README.md`, SHA `c7deda650b12783ff902a5372042b6638624ae3b`, and `WORKFLOWS.md`, SHA `1fd1083d0785b1edede191a1ae545b946b48ac2f`; direct file inspection.
- SOURCE-GH-022 — `Masterleeaus/Worksuite-Saas---Project-Management-System_Laravel` main, `Modules/StaffCompliance/Services/ComplianceDashboardService.php`, SHA `d76dd5581361789ccb509b6b13917ec49a5863e3`; direct file inspection.
- SOURCE-GH-023 — Agent-Mesh #769 Environmental Intelligence, #423 Compliance/Audit/Governance, #430 certification; direct open-issue inspection.
