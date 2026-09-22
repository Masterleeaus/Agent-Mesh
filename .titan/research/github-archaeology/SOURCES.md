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


- SOURCE-GH-077 — Targeted AI Coding Studio repository searches for Ollama, LM Studio, localhost model and local inference; no concrete local-inference adapter found in returned implementation evidence.
- SOURCE-GH-078 — Titan Builder `browser-extension/src/sidepanel.html` and provider-routing search evidence; current provider selector enumerates browser-hosted ChatGPT/Claude/Gemini/DeepSeek/Perplexity/GLM/Grok.
- SOURCE-GH-079 — Titan Builder `pid.md`, SHA `410f437b09ca268f813268d0db4016a8a4576023`; local Node execution + browser-provider reasoning separation.
- SOURCE-GH-080 — Agent-Mesh issue search: #647 Device/Distributed Intelligence Runtime, #80 Intelligence Runtime integration, #645 Edge Fabric, #649 Titan Code browser convergence.
- SOURCE-GH-081 — TitanPro `resources/reference/titan/titan_bos_expanded_script.md`; historical product architecture explicitly names BYO OpenAI/Anthropic/Google/Ollama/local models, treated as architecture/product evidence rather than implementation proof.


- SOURCE-GH-082 — TitanPro `Modules/TitanNexus/Agents/MarketingAgent/agent.manifest.json`, SHA `c54f5dc98a8a91e36bc132c611e6f69fdd76fd3e`; MarketingAgent ownership and approval boundaries.
- SOURCE-GH-083 — TitanPro `Modules/TitanNexus/module.json`, SHA `3cbe78954ed770d80bb2cf203adaed035687559c`; TitanNexus 0.19.0 advertised capability surface.
- SOURCE-GH-084 — InvoiceFollowupTool SHA `4fd787b5b87217402fbab99a5e865007ec578676`, PaymentLinkTool SHA `84b60320afc57d0376d0f18994a8e57e54e43e68`, PaymentPlanTool SHA `7e43816e3831f051921819701afe60d77982a279`, JobStatusAssistTool SHA `4c6957e23d35ab4802f976ce54ebd1318f1e5983`; direct inspection demonstrates draft/wrapper maturity.
- SOURCE-GH-085 — TitanPro `Modules/TitanNexus/AI/Tools/LeadScoringTool.php`, SHA `293faed545562e78bdf23932a409f8e4d0fb4117`; direct draft/approval-required scoring handler.
- SOURCE-GH-086 — TitanPro `Modules/TitanNexus/Agents/MarketingAgent/memory/payment-memory.schema.json`, SHA `ef43e9f28d5ac8eafc6765fe0198c7c95fcabc7f`; legacy tenant_id invoice/payment/job-pattern memory schema.


- SOURCE-GH-087 — cleanly `docs/01-PWA/17-edge-node-and-pwa-runtime-contract.md`, SHA `244abc24da9556ecdb103b22280f23ed52efe7ca`; device identity/trust, bootstrap, offline queues, replay, evidence, revocation and conflict contract.
- SOURCE-GH-088 — cleanly `docs/01-PWA/01-system-doctrine.md`, SHA `1b5107b41277ad332a867932c09461a53e7c5204`; historical nine-node taxonomy, company_id doctrine and role-specific PWA principle.
- SOURCE-GH-089 — cleanly `docs/Titan_Blueprints/13-SYNC-OFFLINE-NODE-BLUEPRINT.md`, SHA `3dd9cb376d541405abcb6c9699e5b90f42ce800d`; sync/offline/checkpoint/replay/security blueprint.
- SOURCE-GH-090 — cleanly `docs/01-PWA/09-canonical-data-model.md`, SHA `1bf7a96325fa9fe38350651597fe23229a77b1c4`; canonical object families and surface projection rule.
- SOURCE-GH-091 — cleanly `docs/dashboards/titan-go.md`, SHA `35b8326bf5326ae6a1fdf2a3075203780332b29b`; field-worker offline/checklist/evidence/safety workflow.
- SOURCE-GH-092 — Agent-Mesh issue search: #641/#636/#542/#549/#550 current PWA owners, #690 Zero/Go/Hub normalization, #645 Edge Fabric, #725 cross-surface continuity.


- SOURCE-GH-093 — cleanly `docs/01-PWA/24-security-identity-device-trust-and-tenant-boundary.md`, SHA `8bf4e285832d00295f25bf4ddd2672147f238e20`; principal domains, company boundary, device trust/revocation, token strategy, audit and approval gating.
- SOURCE-GH-094 — cleanly `docs/01-PWA/11-security-identity-and-governance.md`, SHA `6a0fda59fe92b1af8cee9d151878540f9f2a1238`; security layers, company/user distinction, approval pipeline, secret management and zero-trust doctrine.
- SOURCE-GH-095 — cleanly `docs/07-workflows/guards.md`, SHA `2ec6dc1a6341aa88304db237d1c0e8a7e0c41192`; deterministic guard contracts and allow/deny/approval/recovery outcomes.
- SOURCE-GH-096 — Agent-Mesh issue search: #302 security/identity/session/credential hardening; #574 distributed identity never grants authority; #725 cross-surface identity; #645 Edge Fabric.


- SOURCE-GH-097 — AI Coding Studio `docs/audits/AI-Coding-Studio-Architecture-Runtime-Audit-Pass1.md`, SHA `2d7b59c134eb10d6ad56afd223682cbd33372cb0`; verified historical extension/runtime security defects.
- SOURCE-GH-098 — Titan Builder `.titan/todo/issues/OpenBrowser-v0.5.0-Titan-Builder-V2.6-Deep-Scan-Issues.md`; deep-audit ledger documenting project-containment, transactional-operation, attachment-correlation and bridge-security repairs.
- SOURCE-GH-099 — zero `docs/SECURITY_TENANCY_ALIGNMENT.md`, SHA `b93d0b410ca6a832b6c61723513518bdd96d9152`; tenant-aware security audit plus explicit legacy tz_audit_log tenancy gap.
- SOURCE-GH-100 — zero `docs/SECURITY_PASS_IMPLEMENTATION_REPORT.md`, SHA `1bf390f4982d915f0c5eee29f1506f9a5ab14ccd`; implemented security domain and deferred AI/signal audit company_id closure.


- SOURCE-GH-101 — Agent-Mesh current repository targeted searches for `tz_audit_log`, audit-event/service/receipt symbols and company-scoped audit terminology; no implementation hit returned by repository search.
- SOURCE-GH-102 — Agent-Mesh issue search confirms #423 Compliance/Audit/Governance, #430 certification, #63 security/privacy/replay certification and #642 engine convergence as current ownership surfaces.


- SOURCE-GH-103 — Agent-Mesh root `package.json`, SHA `242c9c9c52f7c7cc1f6e99cf8c822fcd0a3982cf`; package still identifies `titan-zero`.
- SOURCE-GH-104 — Agent-Mesh root `README.md`, SHA `f650b1fad560ee78f9c9ecb68e645bb3a538b2f2`; current main product identity and documentation hierarchy are Dovetails FSM.
- SOURCE-GH-105 — Agent-Mesh `AGENTS.md`, SHA `cac042dc94ccdd5855351dd82c5989478bab27a2`; current execution contract makes Dovetails canonical docs authoritative.
- SOURCE-GH-106 — Agent-Mesh `docs/canonical/ARCHITECTURE.md`, SHA `bf6a891f0097332ecb14f8f0a2310b1b14269631`; Dovetails runtime architecture and account-scoped tenancy.
- SOURCE-GH-107 — Agent-Mesh `docs/canonical/DOMAIN_MODEL.md`, SHA `074def8446dd2a7753e75929061456f4739db144`; Dovetails field-service domain model.
- SOURCE-GH-108 — Agent-Mesh `ai/INVARIANTS.md`, SHA `f12b418b269137a9e77cae4a97559f2f9cc6c442`; current account_id scoping and warning that production/dev DB superuser bypasses RLS.


- SOURCE-GH-109 — Agent-Mesh commit `09c72e357784fb5a588c33f912aba60a5fa8ce42`, `Make Dovetails the base app; archive previous Titan system under titan/`; explicit base-app pivot.
- SOURCE-GH-110 — GitHub compare `09c72e...^` → `09c72e...` resolves parent/base `3063eb6306879e54888e35fddad9e07596c41c2a` and shows the large root authority/application transplant.
- SOURCE-GH-111 — Agent-Mesh at ref `3063eb6306879e54888e35fddad9e07596c41c2a`, `AGENTS.md` SHA `153d74c75b3fbaa4b1cd42ffd8ff368f7faf2c5c`; explicit Titan Zero Agent Mesh V3 authority and non-negotiables.
- SOURCE-GH-112 — Agent-Mesh at ref `3063eb...`, `README.md` SHA `8e9c73640ef7c3a001d5090f6e36c0809896df12`; canonical extracted Titan Zero Merge84 source on main.
- SOURCE-GH-113 — Agent-Mesh at ref `3063eb...`, `roadmap/INDEX.json` SHA `2e178e68a655aa077aa1fcddf652c43759efc9de`; authoritative Titan Zero TypeScript roadmap.
- SOURCE-GH-114 — Follow-on convergence commits: `76a7c8c...`, `94568b3...`, `02ca896...`, `3fce403...`, `a18c0a9...`, `44d2cad...`; Titan platform/core/capability/app migration into Dovetails base.
- SOURCE-GH-115 — Rebrand-back commits including `d21e6d2...`, `ce82866...`, `dcb1db5...`, `69b5e30...`, `9dd1042...`; evidence the transplanted shell was subsequently returned to Titan Zero visible identity.


- SOURCE-GH-116 — current main `packages/titan-platform/src/intelligence.ts`, SHA `8320eef651c334789a950163ed277238bd8311f6`; current Signal/Model Council/Nexus/provider/risk exports.
- SOURCE-GH-117 — current main `packages/titan-platform/src/distributed/authority.ts`, SHA `52972f28b6f14a95741afd9803b7bf5e8f358f58`; company-bound authority/trust neutrality and authority bands.
- SOURCE-GH-118 — current main `packages/titan-platform/src/interface-runtime.ts`, SHA `628194c355be3aec6997c8e0c0be987f5975ad00`; canonical company/surface presentation runtime.
- SOURCE-GH-119 — current main `packages/settings/control-plane/ai-cost-routing-settings.mjs`, SHA `d367fff82b2479d209a64ac6bbf0e7a9f253132a`; Cost Sovereignty and strict company-boundary input.
- SOURCE-GH-120 — current main `apps/web/lib/titan/workforce-command-gateway.ts`, SHA `e40a6640a58096316a9972d66cb96d8f36f13778`; Dovetails session.accountId currently projected as Titan company identity.
- SOURCE-GH-121 — current main `apps/web/lib/titan/interface-runtime/host.ts`, SHA `e044fa95d0c773aaa64e1c56756e939d19aaa8a5`; Zero/Go/Hub host navigation.
- SOURCE-GH-122 — current main `apps/web/lib/titan/workforce-hierarchy/delegation-envelope.ts`, SHA `fde1e0184095056235d430fe55785b21e38001f2`; canonical workforce delegation binding.


- SOURCE-GH-123 — current main `packages/titan-platform/src/intelligence.ts`, SHA `8320eef651c334789a950163ed277238bd8311f6`; facade references ported Titan intelligence/AI Core modules.
- SOURCE-GH-124 — direct current-main fetch attempts for `ported/titan-intelligence/model-council/index.js`, `signal/index.js`, `nexus/index.js` and `ported/titan-ai-core/provider-registry.js` returned NOT_FOUND.
- SOURCE-GH-125 — migration commit `76a7c8c1387be83ebed37f9e0c79fbfa3d77b54c`; contains Titan intelligence regression tests and facade but its file inventory does not include the referenced ported intelligence/AI-core implementation directories.


- SOURCE-GH-126 — current main Model Council `packages/titan-platform/src/ported/titan-intelligence/model-council/index.ts`, SHA `f989f8ba7e39ba0e807251dc625edc2c2d2672c2`.
- SOURCE-GH-127 — current main Signal `packages/titan-platform/src/ported/titan-intelligence/signal/index.ts`, SHA `847a14df1b68278330971a97c05d679d0f606e15`.
- SOURCE-GH-128 — current main Nexus `packages/titan-platform/src/ported/titan-intelligence/nexus/index.ts`, SHA `f7936d44dcf30fd9cb0d091af0efbc10fbcd501a`.
- SOURCE-GH-129 — current main AI Core provider registry `packages/titan-platform/src/ported/titan-ai-core/provider-registry.ts`, SHA `7e5d9f996c9225672ca0c5973ace97376210b07f`.
- SOURCE-GH-130 — current main deterministic risk classification `packages/titan-platform/src/ported/titan-intelligence/core/risk-classification.ts`, SHA `c604b81cbd5a614b7ee3d6d6fefab9608528195a`.
- SOURCE-GH-131 — Agent-Mesh commits `2a9b662...`, `6394463...`, `364bbaa...`, `71c3842...` show post-transplant Model Council convergence/hardening.
- SOURCE-GH-132 — Agent-Mesh commits `647ae85...`, `1179072...`, `10ebc1f...` show post-transplant AI provider registry convergence/hardening.


- SOURCE-GH-133 — current main `packages/titan-platform/src/ported/titan-runtime/contracts/schemas/DecisionPacket.schema.json`, SHA `1f482e924f4f799b852c903df78b8ace326b66d7`; company-bound authority-neutral DecisionPacket.
- SOURCE-GH-134 — Agent-Mesh commit `40a5db11d923b9260e911be1718eea0e434ee82c`; locks DecisionPacket recommendations to no-authority schema.
- SOURCE-GH-135 — current main `packages/titan-platform/src/workforce.ts`, SHA `98f77554d22f76aa1131a257a171c803bfa43979`; exports current Workforce Knowledge Authority capability.
- SOURCE-GH-136 — Knowledge Authority convergence commits `3a27e462...`, `0767213...`, `389d864...`, `ab436cf...`.
- SOURCE-GH-137 — current main `packages/titan-platform/src/ported/titan-workforce/handover/investigation-installation-handover.ts`, SHA `415ee5647bed8a54b60d4e18ee628c67316d97ee`; governed investigation, Business Discovery, installation planning and commissioning implementation.


- SOURCE-GH-138 — Agent-Mesh issue #59, `[TZ-ROADMAP-52] Decision runtime, persistent decision state and temporal re-evaluation`; explicitly lists persistent Decision Object, lifecycle state and watch/trigger/temporal re-evaluation as remaining work.
- SOURCE-GH-139 — TitanPro `docs/06-automation/decision-envelopes.md`, SHA `b1417ca5a841ad1262d1fdf46ff4d0bc1caad410`; durable bounded decision-envelope semantics.
- SOURCE-GH-140 — TitanPro `docs/06-automation/runtime-state-store.md`, SHA `3cc1784ff63462e416a2be8312b815b42cb51c82`; current state + append-only history, approval/retry/recovery semantics.
- SOURCE-GH-141 — TitanPro `docs/06-automation/worked-engine-examples.md`, SHA `96d071e1ca9e362fc2846f93854f51e1ac05e67e`; temporal trigger, suppression and replay examples.
- SOURCE-GH-142 — TitanPro `docs/07-workflows/stuck-state-detection.md`, SHA `48740d987456ef8ae1aae5414a7b544df02ef7a6`; scheduled/event-driven watch and recovery semantics with workflow-truth boundary.


- SOURCE-GH-143 — Agent-Mesh issue #768, `[ARCHITECTURE] Define Personal Zero Understanding & Experience contracts`; current canonical Personal Zero convergence target and One/principal identity correction.
- SOURCE-GH-144 — Agent-Mesh issue #153, canonical company-scoped Business Memory & Knowledge runtime.
- SOURCE-GH-145 — Agent-Mesh issue #767, canonical Business Reality/Evolution recovery/convergence target.
- SOURCE-GH-146 — Agent-Mesh commit `3f7c3f8ffd18cf165206f3ed6deddc9d4c9fe62c`, “research(library): confirm Personal Zero owner gap.”
- SOURCE-GH-147 — Agent-Mesh commits `93f06b2600faac271a17e4b547decba03bb07dbe` and `4450e857481ecc5d96086e994bde82f2a6e76647`; register Personal Zero convergence action and owner-selection checkpoint.


- SOURCE-GH-148 — current main `packages/titan-platform/src/ported/titan-workforce/handover/investigation-installation-handover.ts`, SHA `415ee5647bed8a54b60d4e18ee628c67316d97ee`; evidence-backed investigation, Business Discovery, installation planning and commissioning baseline.
- SOURCE-GH-149 — direct Agent-Mesh searches for OnboardingPro service names `BusinessRealityGraphService`, `ContinuousBusinessObservationService`, `BusinessReconfigurationService`, `NexusReassessmentService`, `OutcomeMeasurementService`, `RollbackDecisionService` returned no current implementation hits.
- SOURCE-GH-150 — issue #767 remains the explicit canonical recovery owner for OnboardingPro Evolution/Reality mechanisms and forbids a second Reality/observation/reconfiguration/provisioning authority.


- SOURCE-GH-151 — Agent-Mesh issue #14, canonical governed execution graph/recovery/compensation and Workforce gateway → Command Bus convergence owner.
- SOURCE-GH-152 — Agent-Mesh issue #293, canonical Reliability/Recovery/Self-Healing implementation owner.
- SOURCE-GH-153 — Agent-Mesh issues #300 and #560, recovery and end-to-end convergence certification owners.
- SOURCE-GH-154 — current main `apps/browser/src/browser/agent-runtime/orchestration/action-journal.js`, SHA `89602043d16dd42d90a7145db4be3e39e1c10540`; storage-backed pre-dispatch intent journal and unknown-outcome handling.
- SOURCE-GH-155 — current main `apps/browser/src/browser/agent-runtime/orchestration/resume-planner.js`, SHA `d3eb25ceadc30926f8172d0d305d5da69ff838ef`; re-perceive rather than replay unknown-outcome actions.
- SOURCE-GH-156 — current main `apps/browser/src/browser/agent-runtime/orchestration/recovery.js`, SHA `d9b355e88a39e2d7fe9c9495785b320b43b4b3a3`; stuck-loop LLM recovery planner, explicitly distinct from business Rewind.
- SOURCE-GH-157 — Agent-Mesh commit `25cb5217b07fe1e0d9adbe5fd058171e88edcd1c`, merged donor ReAct recovery/browser orchestration runtime.
