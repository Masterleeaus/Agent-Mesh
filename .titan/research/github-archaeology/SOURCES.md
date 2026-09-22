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


- SOURCE-GH-024 — `Masterleeaus/TitanPro` main, `docs/09-communications/Titan_Unified_Inbox.md`, SHA `02546d5021ce302043901c4f22a020dead3996b3`; direct file inspection.
- SOURCE-GH-025 — `Masterleeaus/TitanPro` main, `docs/01-PWA/21-communications-voice-and-consent-architecture.md`, SHA `58cac4abb9c3fa76497f6ab626468a3698b8e809`; direct file inspection.
- SOURCE-GH-026 — `Masterleeaus/Worksuite-Saas---Project-Management-System_Laravel` main, `TitanDocs/docs/09-communications/Titan_Communications_Orchestration_and_Fallback_Model.md`; direct file inspection.
- SOURCE-GH-027 — `Masterleeaus/TitanPro` main, `resources/reference/titan/titan_bos_expanded_script.md`, SHA `7260a681ac7d9d3a498883bb4729f60743db9d3e`; direct file inspection.
- SOURCE-GH-028 — Agent-Mesh #234 canonical Communications & Channels runtime and #240 certification; direct open-issue inspection.


- SOURCE-GH-029 — `Masterleeaus/zero` main, `app/Events/Predict/PredictionFeedbackRecorded.php`, SHA `c08b691fbf788af791055b3a75eebd3a8165e335`; direct file inspection.
- SOURCE-GH-030 — `Masterleeaus/zero` main, `docs/modules/MODULE_06_ExecutionTimeGraph_report.md`, SHA `109f06369f86e82f7d8679a873479d83ab9d518d`; direct file inspection.
- SOURCE-GH-031 — `Masterleeaus/TitanPro` main, `Modules/Accountings/Services/CashflowForecastService.php`, SHA `18f5f2b85082b146d84354fdaf6a5fab38fa1545`; direct file inspection.
- SOURCE-GH-032 — `Masterleeaus/TitanPro` main, `Modules/NexusGrowth/module.json`, SHA `0a71690619c94807ced047ee34acd396a81c536c`; direct file inspection.
- SOURCE-GH-033 — Agent-Mesh #768 Personal Zero/Experience and #293 Reliability/Recovery/Rewind convergence; direct open-issue inspection.


- SOURCE-GH-034 — `Masterleeaus/Titan-Builder` main, `src/operations/index.ts`, search revision `3163e9724cd6640e1b39a913d883f5aad139ba40`; direct implementation inspection.
- SOURCE-GH-035 — `Masterleeaus/TitanPro` main, `Modules/TitanCore/Contracts/AI/ToolRollbackContract.php`, SHA `0e41792ff3e73ccb0c91baf66832dc49dfccf8de`; direct implementation inspection.
- SOURCE-GH-036 — `Masterleeaus/TitanPro` main, `Modules/TitanCore/Services/Upgrade/UpgradeRollbackRunner.php`, SHA `8870d4d5168a66514a9c25b438a26c7e9a223503`; direct implementation inspection.
- SOURCE-GH-037 — `Masterleeaus/zero` main, `config/titan_process.php`, SHA `91fe151b0b94cd8704b3cd0933001dbabb4bf7ba`; direct file inspection.
- SOURCE-GH-038 — Agent-Mesh #14 governed execution/compensation, #293/#300 reliability/recovery, #642/#560 engine convergence/certification and #330 upgrade/rollback certification; direct open-issue inspection.


- SOURCE-GH-039 — `Masterleeaus/clean` main, `.titan/documentation/status/phase-completion.md`, SHA `baca0717fde6dacd1a4c20c6bfc83b2310762341`; direct completion/merge evidence for Phases 1–4.
- SOURCE-GH-040 — `Masterleeaus/clean` main, `app/TitanOS/Knowledge/Services/TitanKnowledgeServiceProvider.php`, SHA `6dff21233e63e0f9d3021196783e5c6c7acf5737`; direct implementation registration evidence.
- SOURCE-GH-041 — `Masterleeaus/clean` main, `app/TitanOS/Foundation/DurableExecution/DurableExecutor.php`, SHA `f1a79251758382c4432fb33178307727c8d4152c`; direct checkpoint/trace implementation inspection.
- SOURCE-GH-042 — `Masterleeaus/clean` main, `app/TitanOS/Safety/Recovery/RecoveryManager.php`, SHA `812924be803669b56b670b3fed57e42bb10a22a4`; direct recovery/savepoint implementation inspection.
- SOURCE-GH-043 — `Masterleeaus/clean` main, `app/TitanOS/Execution/OwnershipLocks/OwnershipLockManager.php`, SHA `78dd5b8e9c8a32bc1aa35bfd64d881042343bd25`; direct lock implementation inspection.


- SOURCE-GH-044 — Worksuite branch `copilot/integrate-aichatpromemory-v1-2` vs `main`: GitHub compare reports diverged, 1 ahead / 559 behind, merge base `e1d359c49e3893dc7546eef8af46e1cad5fc6289`.
- SOURCE-GH-045 — Worksuite donor `codetouse/AiChatProMemory_extracted/AiChatProMemory/extension.json`, SHA `dab88ad24cf2c46762b4caa9a63c7678a44e9094`; identifies AI Chat Pro Memory v1.2.
- SOURCE-GH-046 — Worksuite donor `System/Http/Controllers/AIChatProMemoryController.php`, SHA `0700cf8f412ad17bb91e51fd5ba23ad9e9ac157f`; direct get/save/clear instruction behavior.
- SOURCE-GH-047 — Worksuite donor `System/Models/UserChatInstruction.php`, SHA `e620791dd505a0a8c8cd01a39eaae7787f808af4`; direct user/category and guest-IP persistence behavior.
- SOURCE-GH-048 — Worksuite donor migration `2025_12_26_163811_add_user_chat_instructions_table.php`, SHA `ffcdcd3484ccad6e14b7d8ba0684689ee5f5e2e6`; schema confirms absence of company/provenance/experience semantics.


- SOURCE-GH-049 — GitHub connector capability inspection: no tag/release listing action exposed in the available GitHub toolset; therefore no Git-tag existence claims are inferred from commit search.
- SOURCE-GH-050 — `Masterleeaus/Titan-Builder` main, `package.json`, SHA `159022f3bc14d9f25cc06f0fb2b8a8cfe48d8bd8`; declares OpenBrowser/Titan Builder development line version 0.5.0.
- SOURCE-GH-051 — `Masterleeaus/AI-Coding-Studio` main, `CHANGELOG.md`, SHA `3ee7ea91220d27a569cd2777a16a3d3aacf2434d`; Pass 01/02 architecture and 2.1.0 release-line evidence.
- SOURCE-GH-052 — `Masterleeaus/TitanPro` main, `Modules/TitanNexus/CHANGELOG.md`, SHA `3180f19f92813ed8dd5aa44cb3be844c84b9a228`.
- SOURCE-GH-053 — `Masterleeaus/TitanPro` main, `Modules/Dispatch/CHANGELOG.md`, SHA `c74ac901abdba98ac22e5e86b7a2b490e4da9862`.
- SOURCE-GH-054 — `Masterleeaus/TitanPro` main, `Modules/CallingAgent/CHANGELOG.md`, SHA `6dd31999e7686767cd6cc8a7734574ba0e39082e`.


- SOURCE-GH-055 — TitanPro `Modules/CallingAgent/AI/Memory/CallerProfileMemory.php`, SHA `9fb66fd85f68daaa6ca28b82dbf2d55b0c5245c9`; direct caller-profile recall/outcome implementation.
- SOURCE-GH-056 — TitanPro `Modules/CallingAgent/AI/Pipelines/OutcomeExtractionPipeline.php`, SHA `15c7f48dccbc98e9d5a3c1af96f30386623d8f3a`; direct structured call outcome heuristic implementation.
- SOURCE-GH-057 — TitanPro `Modules/CallingAgent/Automation/Pipelines/MissedCallRecoveryPipeline.php`, SHA `13a5668c5713cd42745fc474e4f36240670ef665`; direct SMS/callback/voicemail recovery-plan implementation.
- SOURCE-GH-058 — TitanPro `Modules/CallingAgent/Services/Providers/ProviderFailoverManager.php`, SHA `dd57494445424d177281a6709c528d1aeeb17b33`; direct provider health/quota failover implementation.
- SOURCE-GH-059 — TitanPro `Modules/CallingAgent/Services/Sip/SipBridgeService.php`, SHA `aadb5947843d84e3e49889ea0ff3e39e21183cf5`; direct SIP bridge-plan implementation.
- SOURCE-GH-060 — TitanPro `Modules/CallingAgent/AI/Agents/PersonaResolver.php`, SHA `829346ed56ab97b069f2156d288df24328763f05`; direct reception-persona implementation.
- SOURCE-GH-061 — TitanPro `Modules/CallingAgent/Services/Calendar/CalendarProviderManager.php`, SHA `7ddb43cf0339782d9a42199fa9ee2023a50a7850`; direct Google/Outlook/CalDAV provider manager.
- SOURCE-GH-062 — Agent-Mesh current owner dedup search: #234 Communications & Channels, #333 Reception & Customer Access, #363 Customer Care/Retention, #343 Sales & Revenue Growth.


- SOURCE-GH-063 — TitanPro `Modules/Dispatch/Actions/Update/RescheduleDispatchAppointmentAction.php`, SHA `cd7d6b19135a5591964d71d649740e50afb1cc7c`; direct rescheduling/work-order synchronization implementation.
- SOURCE-GH-064 — TitanPro `Modules/Dispatch/Services/Analytics/DispatchKpiService.php`, SHA `a91252721abe6be8147a392b7f397bc33579f15b`; direct dispatch KPI implementation.
- SOURCE-GH-065 — TitanPro `Modules/Dispatch/Database/Migrations/2026_05_13_000700_create_dispatch_quality_and_sla_tables.php`, SHA `f7c957e336fc9b1dc5ad6f1cbd99a367fa69c2d9`; direct SLA/checklist/exception schema.
- SOURCE-GH-066 — TitanPro `Modules/Dispatch/Routes/api.php`; search inspection confirms schedule, reschedule, technician recommendation, assignment status, route build and resequence API surfaces.
- SOURCE-GH-067 — Agent-Mesh owner dedup search: #353 Scheduling/Dispatch/Capacity, #360 certification and #183 CRM/service-execution lifecycle.


- SOURCE-GH-068 — TitanPro `docs/04-AI/orchestration.md`, SHA `f0acf3476a6edb171181f39b733938007e092c62`; multi-core participation/sequencing/critique/convergence/escalation design.
- SOURCE-GH-069 — TitanPro `docs/04-AI/weighting-and-consensus.md`, SHA `bda664184804597402412007d1d8cc85f1cc01a5`; weighting, multiple consensus classes, risk thresholds and replay design.
- SOURCE-GH-070 — TitanPro `docs/04-AI/specialist-cores.md`, SHA `617ea3ca42e860a0227112b75dc2b9f820810183`; specialist reasoning lanes, common context discipline and governance separation.
- SOURCE-GH-071 — TitanPro `docs/04-AI/evaluation.md`, SHA `c3b72fd0b538ec3fe7463a508e3b83957e4dafd6`; outcome/evaluation/refinement semantics.
- SOURCE-GH-072 — TitanPro `docs/04-AI/model-routing.md`, SHA `04a4a2cabdee5eebb54074b2e6cb94d2e1cc55bf`; privacy/cost/latency/local-server-external routing precursor.
- SOURCE-GH-073 — Agent-Mesh current owner search: #642 and #80 explicitly include Model Council; #633 owns AI/Decision/Intelligence convergence.


- SOURCE-GH-074 — AI Coding Studio `docs/agents/agent-2-local-bridge-report.md`, SHA `50e8efe6f69abd891b9a523a94627161efc541e9`; hardened Local Bridge protocol/risk/approval/path/secret-filter lineage and explicit implementation limitations.
- SOURCE-GH-075 — Titan Builder `pid.md`, SHA `410f437b09ca268f813268d0db4016a8a4576023`; OpenBrowser browser-provider/local Node architecture, project context, diff/apply workflow and browser subscription path.
- SOURCE-GH-076 — Titan Builder main search evidence: `browser-extension/bridge-trust.ts`, `browser-extension/README.md`, workspace/security audit records; authenticated loopback, separated credentials, local companion, preconditions and rollback controls.
