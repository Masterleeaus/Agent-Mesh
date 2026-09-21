# home_hub

home services app

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

Pass 7 adds the Titan Schedule & Dispatch full-page operational surface with job timeline, worker assignment and rescheduling routed through TitanGateway.


## Pass 8 — Titan Go field workflow
Added job detail, customer call/message actions, governed job status transitions (scheduled → en_route → arrived → in_progress → completed), job notes, checklist persistence commands, and direct evidence capture. Schedule cards open the operational job page. Mutations remain behind TitanGateway and are offline queueable where appropriate.


## Pass 9 — Commercial lifecycle
Added the minimum quote → approval → job completion → invoice → payment flow. The lifecycle is accessible from Job Detail and generative quote/payment cards, while mutations route through TitanGateway.


## Pass 10 — Customer context
Added lightweight customer records, multiple service addresses, call/SMS/email actions, contact history and generative customer cards. Customer detail remains invoked from conversation rather than becoming permanent CRM navigation.


## Pass 11 — Team in Your Pocket
- Reframed the mobile shell as a conversational workforce interface rather than module navigation.
- Home now has exactly three proactive staff cards: Dispatch, Access and Accounts.
- Added workforce provenance to generative UI: canonical agent ID/name, team, workforce position, capability, authority, approval state, signals/evidence and receipt reference.
- Added direct-staff/team prompt examples and manager/orchestrator-style routing semantics.
- Operational Map, Schedule and Evidence remain available through the composer tools sheet rather than permanent home navigation.
- Fixed quote.send classification to online-required in the capability registry.
- Voice remains explicitly unconfigured in the local MVP instead of pretending the microphone is live.


## Pass 12 — Real workforce conversation contexts
- Added persistent conversation scope: Titan routed, whole team, Operations manager, Dispatch, Access and Accounts.
- Addressing “Dispatch,” “Access,” “Accounts,” “Operations,” or “Team,” now routes the turn into that real conversation context.
- Added visible context switching without creating duplicate surface-specific agents.
- Conversation turns record who/team they were addressed to.
- Operations/whole-team requests demonstrate manager/orchestrator delegation into canonical specialists.
- Direct specialist contexts keep responses bounded to that staff member’s pain/outcome area.
- Added workforce.delegate and workforce.context.switch capabilities.


## Pass 13 — Proactive staff presence
- Added a proactive workforce inbox/feed with persistent staff identity and unread state in the running session.
- Dispatch, Access and Accounts can now initiate conversations with the user instead of only waiting for prompts.
- The three home staff cards display each staff member's latest proactive message and unread count.
- Opening a proactive staff card marks that staff context read and injects the agent-initiated conversation into the thread.
- Agent-initiated turns are visually distinguished from user-addressed turns.
- Proactive items retain canonical conversation context and generative workforce provenance.
- Added workforce.proactive.feed and workforce.proactive.open capabilities.
- This MVP feed is local/in-memory; production delivery still belongs to Signal Engine + authenticated push/backend state.


## Pass 14 — Persistent staff/team threads
- Split the single mixed conversation into independent threads for Titan-routed, Whole Team, Operations, Dispatch, Access and Accounts.
- Switching staff/team restores that context's own conversation history.
- Historical note (pre-Pass33): threads used SharedPreferences. Pass 33 now stores the same scoped threads in authenticated encrypted local repositories.
- Full generative items and workforce provenance are serialized with each turn.
- Agent-initiated messages persist in the correct staff thread.
- Re-opening an already-read proactive card no longer duplicates the same proactive message.
- Added workforce.thread.restore and workforce.thread.persist capabilities.
- Superseded by Pass 33: sensitive local projections now use authenticated encrypted storage while preserving the canonical offline scope.


## Pass 15 — Visible delegation and workforce task progress
- Added a canonical workforce task model with task ID, owner agent, delegating manager/orchestrator, objective, status, progress and result summary.
- Generative workforce cards can now show manager → specialist delegation chains.
- Added visible progress indicators and returned results so users can see work moving through the team rather than receiving disconnected answers.
- Operations demo now shows Service Delivery delegating late-start recovery to Dispatch, with the completed result flowing back for review.
- Workforce task metadata serializes into persistent staff/team conversation threads.
- Added workforce.task.progress and workforce.task.result capabilities.


## Pass 16 — Parallel multi-agent missions
- Added a workforce mission model that lets one manager/orchestrator fan a business outcome out to multiple canonical specialists in parallel.
- Missions contain manager identity, objective, status, specialist subtasks, overall progress, approval state and one consolidated manager result.
- The Operations demo now coordinates Dispatch, Access and Route specialists simultaneously for the outcome “make tomorrow run smoothly”.
- Each specialist returns its result to Service Delivery; the user receives one combined answer instead of three disconnected reports.
- Mission metadata serializes through the existing persistent generative conversation envelope.
- Added workforce.mission.coordinate and workforce.mission.aggregate capabilities.
- Added the Pass 11–16 cumulative workforce checkpoint manifest.


## Pass 17 — Governed mission approval, execution and receipts
- Multi-agent missions now expose explicit Approve plan / Reject plan decisions before consequential execution.
- Approval is recorded through workforce.mission.approve; rejection through workforce.mission.reject.
- Approved specialist tasks execute through their declared capability IDs and carry deterministic mission/task idempotency keys.
- Dispatch assignment and route-plan acceptance can enter the local governed command queue.
- Customer messaging is explicitly online-required in this mission and is reported as blocked when the live Titan server is unavailable; the MVP never pretends it was sent.
- Every specialist execution attempt returns a receipt with task, agent, capability, status, summary, idempotency key and timestamp.
- Receipts are rendered inside the mission card and persisted in the same workforce conversation thread.
- Duplicate approve/reject decisions are prevented at the conversation layer.
- Corrected generated-action routing so “Open schedule” reaches Schedule rather than the generic job-open branch.


## Pass 18 — Trust cycles and gated autonomy
- Added capability-specific persistent trust profiles per canonical agent.
- Autonomy ladder is Suggest → Assist → Semi-Auto → Auto → Trusted Auto.
- Confirmed-cycle thresholds are 1, 2, 3 and 5 for successive unlocks; these are eligibility thresholds, not automatic authority grants.
- Queued commands do not count as successful outcomes. The user must explicitly confirm the real outcome before a trust cycle is credited.
- Each receipt can be counted only once, preventing repeated taps from inflating trust.
- The next autonomy level requires a tri-handshake: system eligibility + explicit user approval + independent agent acceptance.
- Agent acceptance and final authority elevation are online-required; this local MVP refuses to elevate authority when the live Titan authority service is unavailable.
- Trust state is persisted by company_id + actor_id + device_id + agent_id + capability_id.
- Trust cards expose current autonomy, progress to next eligibility and the three gate states directly in the conversation.
- Added workforce.trust.cycle.confirm, workforce.trust.user_approve, workforce.trust.agent_accept and workforce.trust.advance capabilities.
- Pass 33 encrypts the local trust projection. Trust/autonomy authority itself remains server-authoritative and must be revalidated.


## Pass 19 — Titan Command owner workforce projection
- The current mobile build is now explicitly the owner/manager projection: canonical surface `zero`, presented to the user as Titan Command.
- Added a reusable mobile projection policy for canonical `zero`, `go` and `hub` surfaces. Surface policy controls which canonical workforce contexts may be exposed; it never creates surface-specific clones of agents.
- Titan Command's exactly-three priority staff cards are now Operations, Exceptions and Accounts instead of field-oriented Dispatch/Access/Accounts.
- Added canonical Exception Resolution Specialist context using `TZAG-OPS-EXCEPTION-RESOLUTION`.
- Added proactive owner briefings from Operations and Exceptions alongside Accounts.
- Conversation switching and direct-address routing now enforce the active surface projection boundary.
- Titan Command still allows deeper authorised conversations with Dispatch and Access when the owner needs them, but they are not permanent home-card slots.
- Session surface is now `zero`; Titan Command remains the user-facing owner-app label.
- Added workforce.surface.project capability.

- Local conversation-thread persistence now also includes the canonical surface in its scope key, preventing an owner `zero` thread from being silently reused by a different mobile surface. Trust state remains capability/agent scoped rather than surface scoped.


## Pass 20 — Owner attention, approvals and business health
- Added a conversation-native owner attention brief instead of introducing a dashboard.
- Service Delivery now synthesizes routine workforce activity into only the items worth owner attention.
- The brief carries business-health wording, total attention count, pending approvals, unresolved exceptions and source-agent provenance.
- Each attention item identifies its source canonical agent, category, priority, summary, approval state, capability, actions and evidence references.
- Current owner demo brief contains: coordinated tomorrow plan awaiting review, unresolved Smith access exception, and three overdue invoice follow-ups.
- Titan Command can route directly from the brief into Operations, Exceptions or Accounts threads.
- “Prepare one plan” asks Operations to combine owner-attention items into one coordinated plan rather than making the owner manage specialists manually.
- The exactly-three home-card rule remains intact: Operations, Exceptions and Accounts.
- Added workforce.owner.attention.synthesise, workforce.owner.health.summary and workforce.owner.approvals.review capabilities.
- Added the Pass 17–20 cumulative Titan Command checkpoint manifest.


## Pass 21 — Dynamic ranked owner priorities (high-throughput slice)
- Replaced static Command home staff slots with a deterministic owner-priority service driven by the current owner-attention brief.
- Home still renders exactly three staff cards, but the staff occupying those slots can change with current urgency, approvals, exceptions and cash issues.
- Ranking uses priority + approval + category weighting, deduplicates staff contexts and then fills any empty slots from the surface projection fallback staff.
- Added persisted owner-attention state with Handled and Snooze 1h lifecycle actions.
- Handled items disappear from the owner queue; snoozed items reappear after expiry.
- Priority cards never expose a workforce context outside the active surface projection.
- Added dynamic owner-attention retrieval to TitanGateway and a reusable OwnerAttentionService.
- Added regression contracts/tests for ranking, snooze/handled state, surface exposure and exactly-three owner cards.
- Added a permanent implementation-cadence contract: implementation passes should be complete functional slices across roughly 8–20+ meaningful files when needed, not one-file micro-passes.


## Pass 22 — Command Decisions, Exceptions and Trust Control
- Added revisioned `TitanDecisionPacket` artifacts for owner-reviewed consequential decisions.
- Decision packets expose source agent, decision type, concise rationale summary, risk class, Assurance state, evidence references, proposed capability/payload, reversibility and online requirement. They deliberately do not expose hidden reasoning.
- Added persisted decision lifecycle state so approval/rejection is revision-specific and old revisions do not silently authorize newer proposals.
- Owner decisions now approve/reject through governed workforce capabilities; approved actions receive deterministic decision/revision idempotency keys.
- Online-required decision effects are explicitly reported as blocked rather than simulated locally.
- Added exception-resolution plans with ownership, cause summary, containment, proposed resolution, evidence and governed execution.
- Added conversation-native Command Control snapshot showing pending decisions, unresolved exceptions and trust upgrades ready for owner review.
- Control can expand into Decisions, Exceptions or Trust inside the conversation rather than becoming a permanent dashboard.
- Added DecisionRepository, DecisionService, ExceptionResolutionService, CommandControlService and DecisionPacketContract validation.
- Added 5 regression tests covering decision ranking/state/revisions/contracts, exception conversion and Command control aggregation.
- Added cumulative Pass 17–22 Titan Command checkpoint.


## Pass 23 — Titan Go field-worker authorised workforce projection
- Added a real Titan Go conversational shell built from the same canonical workforce as Command; no field-specific duplicate agents were created.
- Added shared build-flavor entry via `TITAN_SURFACE` (`zero`, `go`, later `hub`) so one Flutter source can produce the three mobile projections.
- Go exposes only authorised operational contexts: Dispatch, Access, Job Prep / First-Time-Fix, Weather, Scope, Exceptions and Operations. Owner-only Accounts is not exposed.
- Added canonical field contexts for `TZAG-FIELD-FIRST-TIME-FIX-PREPARATION`, `TZAG-OPS-WEATHER-DISRUPTION-MANAGEMENT` and `TZAG-OPS-SCOPE-VARIATION-GUARDIAN`.
- Added active-job field snapshot and readiness state including timing, access, first-time-fix prep and weather.
- Titan Go home remains conversation-first and renders exactly three ranked field-staff cards based on current readiness/urgency.
- Added full field tools access for Active Job, Ready / Field Kit, Map / Navigate, Evidence and escalation without turning them into permanent primary navigation.
- Added persistent staff/team conversation threads scoped to company_id + actor_id + device_id + `go`.
- Added governed field escalation through `workforce.field.escalate`, owned by the canonical Exception Resolution Specialist.
- Added an Escalate to team action directly inside the active Job screen for Go.
- Added Go surface validation and 5 field regression tests covering readiness, ranking, surface isolation, escalation binding and canonical identity reuse.
- Flutter build flavor example: `--dart-define=TITAN_SURFACE=go`; default remains `zero`.


## Pass 24 — Go schedule integrity, load balancing and cancellation-gap recovery
- Added the canonical Schedule Integrity (`TZAG-OPS-SCHEDULE-INTEGRITY-SPC`), Cancellation Gap Filling (`TZAG-OPS-CANCELLATION-GAP-FILLING`) and Load Balancing (`TZAG-WF-LOAD-BALANCING`) specialists to the authorised Go projection.
- Added a worker-scoped day plan containing confirmed jobs, optional gap-fill work, travel estimate, recoverable idle time, schedule signals and prepared worker actions.
- Schedule Integrity now protects arrival windows and surfaces only worker-relevant risks.
- Cancellation Gap Filling can offer an optional nearby job only when it fits without moving confirmed work.
- Load Balancing checks the worker's day against configured capacity/overtime risk before gap recovery is recommended.
- Go's exactly-three priority staff cards now rank both current-job readiness and whole-day schedule signals. In the current demo, Access and Schedule can outrank lower-risk staff when appropriate.
- Added a worker-only Today screen rather than exposing the owner/dispatcher schedule board.
- Worker actions are requests, not unilateral global schedule mutations. `field.schedule.accept_gap_job` carries `requires_server_recheck=true`; Titan must revalidate live company state and authority before applying it.
- Added a contract that rejects any Go day action marked as directly changing another worker's state.
- Added persistent local projection for acknowledged/accepted day-plan actions.
- Added direct conversational responses for Schedule, Gap Fill and Load specialists.
- Added a non-card Today status strip so the home still contains exactly three live staff cards.
- Added 6 regression tests for the day plan, schedule integrity, cancellation-gap safety, load/overtime logic, orchestration and field-action authority boundary.


## Pass 25 — Go route, access and weather departure readiness
- Added the canonical Route Compression specialist (`TZAG-OPS-ROUTE-COMPRESSION`) to the authorised Go projection.
- Added an ordered, revisioned worker route with stop sequence, access state, weather state, optional-work flag, travel estimate and evidence references.
- Added a Before You Leave briefing that combines Route + Access + Weather before the worker relies on navigation.
- Unconfirmed customer access remains a real blocker; reviewing instructions locally does not convert an unconfirmed gate into confirmed access.
- Customer access confirmation uses an online-required capability. The local MVP explicitly reports that nothing was sent when the live Titan service is unavailable.
- Added weather/travel-condition modelling and governed route-replan proposals.
- Route replans from Go cannot change confirmed customer promises. The safe disruption response is to remove optional gap-fill work first while preserving confirmed-stop order.
- Every replan request is bound to the visible route revision and carries `requires_server_recheck=true`.
- Added persisted route-review state for reviewed access instructions, confirmation requests and accepted replan requests.
- Upgraded the map to render ordered worker-route stops, route polyline, optional-stop labels, access state and weather state while retaining external turn-by-turn navigation handoff.
- Route disruption can enter the same exactly-three dynamic Go priority layer when it becomes more important than lower-risk field staff.
- Added route/departure contracts and 7 regression tests covering route ordering, access readiness, departure blockers, replan safety, revision binding and Go/Hub surface isolation.


## Pass 26 — Go first-time-fix, scope variation and evidence completion gate
- Added a revisioned field scope baseline for the active job with included work, excluded work, customer notes and source evidence references.
- Added a canonical first-time-fix plan containing preparation steps, supplies, known failure risks and explicit evidence requirements.
- Required evidence is now purpose-bound: each completion requirement has an immutable requirement ID, evidence kind, label and purpose.
- The evidence capture screen can be opened for a specific requirement and restricts capture to the required evidence kind. Successful local queueing marks that requirement satisfied in the scoped job execution state.
- Requirement-bound evidence uses `field.evidence.requirement.capture`; ordinary ad-hoc evidence continues through `job.evidence.attach`.
- Added persistent field-job execution state scoped by company + actor + device + surface + job.
- Added scope variation reporting from the actual Job screen. A worker records what changed; Titan binds it to the visible scope revision and escalates it for owner/manager review.
- Field workers cannot self-authorise a variation, price change or extra-work approval.
- Added a real completion gate: job completion is blocked until the ordinary checklist is complete, required evidence is present and no unresolved scope variation remains.
- Added First-Time-Fix and Scope contracts so job/scope identity, revision, unique evidence IDs and field authority cannot silently drift.
- Rebuilt the Job screen to remove the duplicate escalation control found during this pass and converge Job + Prep + Scope + Evidence into one governed workflow.
- Added 7 regression tests covering first-time-fix plans, completion gating, scope classification, variation construction/authority, plan validation and field snapshot integration.


## Pass 27 — Go field handoffs and governed customer contact
- Replaced the old direct `workforce.field.escalate` pathway with one canonical `workforce.field.handoff` boundary.
- Added canonical Customer Care (`TZAG-CX-CUSTOMER-EXPECTATION-MANAGEMENT`) and Callback Prevention (`TZAG-CX-CALLBACK-PREVENTION`) contexts to the authorised Go projection.
- Field issues now route by category: Access → Access specialist, Scope change → Scope Guardian, Customer/late-arrival → Customer Care, and unresolved/general issues → Exception Resolution.
- Handoffs persist as conversation receipts with job identity, target canonical agent, status, evidence references and customer-contact state.
- Added a separate customer-contact request flow. The worker states the field outcome needed; Customer Care owns the customer-facing plan.
- Customer-contact plans start as `prepared_not_sent`. Actual customer messaging remains online-required and cannot be claimed as sent by the local MVP.
- Urgent customer contact is marked `manager_review_required`; normal field requests are recorded without silently granting sending authority.
- Titan Go now suppresses direct Call/SMS controls in the active Job screen and replaces them with `Ask Customer Care to contact customer`, keeping communication inside the workforce/governance pathway. Other surfaces retain their existing contact controls unless they opt into this policy.
- Scope variations now also use the canonical handoff pathway, so there is no second escalation mechanism for the same field issue.
- Removed the superseded field escalation model/service/test after confirming the Go flow no longer depended on them.
- Added authorised-target, customer-contact and receipt contracts plus 7 regression tests.


## Pass 28 — Titan Go convergence and authority checkpoint
- Completed the six-pass Go checkpoint spanning Passes 23–28.
- Fixed a checkpoint-discovered integration bug: `FieldWorkforceService` already passed the first-time-fix execution plan into priority ranking, but `FieldPriorityService` did not accept that parameter. The priority service now explicitly accepts the execution plan and can use known job risks without creating extra home cards.
- Replaced the global offline command queue key with a strict `company_id + actor_id + device_id + surface` scope. The old unscoped v1 queue is intentionally not imported because its tenant ownership cannot be proven safely.
- Added explicit `TitanCommandScope` and command-scope validation. Commands without company, actor, device or canonical surface are rejected before persistence.
- Added local command idempotency keys and parsed duplicate detection instead of brittle string matching.
- The local gateway now enforces the central capability registry. Unknown capabilities, online-required capabilities and capabilities not authorised for offline queueing cannot be silently placed in the local queue.
- Registry online requirements override caller mistakes. For example, `customer.message` remains blocked locally even if the caller forgets to set `onlineRequired`.
- Expanded workforce provenance to the canonical mobile envelope: agent, capability, conversation ID, originating signals, evidence, authority, approval, proposed actions, surface, company, actor and device.
- Conversational and proactive workforce responses are bound to that runtime envelope before the mobile UI receives them, and the envelope survives conversation-thread persistence.
- Evidence command metadata no longer includes the local device filesystem path. It uses the evidence ID as the local reference while upload transport remains a future authenticated service.
- Added a cross-feature `GoCheckpointContract` covering the current job, readiness, execution plan, worker day plan, route, projection isolation and priority-card uniqueness.
- Added conversation-compatible Field System Status diagnostics showing projection coherence, authority contraction and the scoped offline queue without pretending this is release certification.
- Added 10 new Pass 28 regression tests covering capability policy, command scope, offline queue isolation/idempotency, online blocking, workforce envelope binding/persistence, proactive provenance, evidence path privacy and Go checkpoint coherence.
- Added cumulative `TITAN_MOBILE_GO_CHECKPOINT_P23_P28.json`.


## Pass 29 — Titan Hub customer-authorised workforce projection
- Replaced the Hub placeholder with a full chat-first Titan Hub shell from the same Flutter source (`TITAN_SURFACE=hub`).
- Hub reuses canonical Customer Care, Access and Callback Prevention identities; it does not create customer-only duplicate agents.
- Home renders exactly three customer-relevant staff cards plus a non-card next-service status strip.
- Added customer-safe My Services, Support and Account capability screens.
- Service changes are request-only through `hub.service.change.request`; Hub does not directly mutate the business schedule.
- Support requests use `hub.support.request`; account updates use `hub.account.update.request`.
- Added the customer-facing `Pay now & save $10` path, but `hub.payment.checkout` is registry-enforced online-only so the local MVP cannot fake payment.
- Added Hub request persistence scoped by company + customer actor + device + hub surface.
- Added a strict Hub privacy projection. Internal worker, dispatch, route, evidence, trust, approval, authority and control artifacts are removed before Hub rendering/persistence.
- Public Hub workforce provenance preserves canonical staff identity but replaces internal capability/authority metadata with a customer-safe projection.
- The gateway now rejects direct Hub access to internal workforce contexts and blocks Hub from fetching owner attention, owner decisions or field workforce snapshots.
- Future Hub proactive feeds are filtered to customer-authorised contexts before delivery.
- Added nine Hub regression test files covering projection, exactly-three cards, privacy sanitisation, routed internal-agent filtering, request contracts/storage, customer command authority, payment blocking, proactive filtering and canonical workforce reuse.


## Pass 30 — Hub booking, service status, reschedule, access and messaging
- Added a Hub-specific conversational intent engine so customer phrases such as `reschedule`, `cancel`, `book`, `confirm access`, `when is my service?`, and `message the team` resolve directly to customer-safe actions.
- Added a Hub-specific proactive service. Hub chat and proactive content no longer normally originate from the internal owner/field demo generator; the privacy projection remains as a second guard.
- Added booking requests with preferred date/daypart/address and notes. The UI explicitly treats these as preferences, not confirmed live availability.
- Added reschedule requests tied to the existing service ID. They remain `queued_for_review`; Hub never calls the internal `schedule.reschedule` path.
- Added explicit cancellation request flow with customer confirmation. The existing service remains confirmed until the business processes the request.
- Added customer service-detail view with a customer-safe status timeline and direct Reschedule, Confirm access, Message team and Cancel actions.
- Added access-confirmation capture with access method, instructions and an explicit permission checkbox. Requests without customer permission are rejected by contract.
- Added customer messaging through `hub.message.request`. Offline messages can be queued, but their state remains `queued_for_delivery`; the app never claims they were delivered.
- Added persistent customer request receipts inside the Hub conversation history.
- My Services now shows locally queued booking/reschedule/cancel/access requests. Support now shows locally queued customer messages separately from support cases.
- Added a central `HubRequestCapabilityRouter` so request type determines the governed Hub capability. The router explicitly identifies direct internal schedule mutations as forbidden.
- Added structured booking/access/message contracts and preserved structured request details through scoped local persistence.
- Registered `hub.booking.request`, `hub.reschedule.request`, `hub.cancel.request`, `hub.access.confirmation.submit`, `hub.message.request`, service status/detail and message-delivery-status capabilities.
- Added nine new Pass 30 regression test files and strengthened existing Hub tests for permission, structured persistence, proactive safety and intent preservation.


## Pass 31 — Hub quotes, approvals, invoices and payments
- Added a customer-safe commercial projection containing quote revisions, quote expiry, line items, invoice line items, authoritative outstanding balance and early-payment offer metadata.
- Added a dedicated `Quotes & Payments` customer capability view plus quote and invoice detail screens.
- Quote acceptance, decline and change are Hub requests (`hub.quote.accept.request`, `hub.quote.decline.request`, `hub.quote.change.request`) rather than direct calls to internal `quote.approve`.
- Quote acceptance requires explicit terms acknowledgement and is bound to the visible `quote_id` + quote revision.
- Quote decisions are rejected locally if the visible quote is expired, no longer awaiting the customer, or the decision references a stale revision.
- Every quote decision carries `requires_server_recheck=true`; local queueing is evidence of customer intent, not authoritative approval.
- Quote response retries use deterministic idempotency by quote + revision + decision so repeated taps do not multiply the same intent in the local queue.
- Added customer-safe invoice detail with outstanding amount and payment entry.
- Payment checkout remains `hub.payment.checkout` and is registry-enforced online-only. Hub cannot call internal `payment.record`, and a local button press never marks the invoice paid.
- Checkout requests are bound to the visible invoice ID, exact outstanding amount and current early-payment saving. Repeated checkout attempts use invoice/balance idempotency rather than a new mutation identity on every tap.
- Rebuilt Account as a customer-safe commercial entry surface; it now routes into Quotes & Payments and the live checkout boundary rather than implementing a separate local payment mutation.
- Hub chat now understands quote, invoice and payment intents using Customer Care. No internal Accounts agent is exposed.
- Hub proactive attention and the existing exactly-three customer staff cards can now surface a ready quote and outstanding invoice while retaining Customer Care, Access and Follow-up as the canonical customer-visible workforce.
- Added cross-surface gateway isolation for the commercial snapshot and a commercial coherence contract for quote/invoice IDs, status, revision and balance consistency.
- Added customer commercial request receipts to the existing persisted Hub request/conversation system.


## Pass 32 — Hub privacy and internal shielding
- Added gateway-level Hub surface isolation. A Hub session can no longer invoke globally registered field/owner/internal commercial mutations merely because the capability exists; Hub commands must use the `hub.*` namespace.
- Added per-capability Hub command payload allowlists, complete request/payment envelope requirements, and recursive rejection of internal keys such as job/worker/route IDs, authority/trust state, evidence refs, signal IDs, device IDs and local paths.
- The gateway now rebuilds every non-payment Hub command through `HubRequestPrivacyService`, validates the customer request contract, and confirms the request type maps back to the invoked Hub capability before local queueing.
- Hub command/request customer identity is bound to the authenticated Hub session actor.
- Request detail persistence now uses per-request allowlists. Access/message/quote details no longer retain duplicated internal identity fields, and preferred-window objects accept only date/daypart/label.
- Customer-visible workforce provenance no longer carries company, actor, device, signals, evidence, execution receipts or internal conversation IDs.
- Canonical TZAG identities remain upstream for routing, while customer-rendered/persisted workforce uses presentation aliases: `hub.customer-care`, `hub.access`, and `hub.follow-up`. These are presentation aliases, not duplicate workforce agents.
- Hub generated actions now use a strict allowlist rather than a blacklist. Internal job/worker generative types are projected to a neutral customer notice.
- Added visible-content scanning for technical identifiers and raw filesystem path patterns across titles, subtitles, field values, context values, workforce names and customer request receipts.
- Added `HubDataPrivacyContract` for direct full-page service/support/account/quote/invoice projections, closing the path that does not pass through generative-card sanitisation.
- Removed technical customer ID from the Hub account UI model. Customer command identity now comes from the authenticated session.
- Added a Hub-only v2 conversation repository that sanitises on both save and load, drops unauthorised conversation contexts, and safely migrates eligible Hub-scoped v1 threads before deleting the legacy record.
- Added privacy-filtered Hub request v2 storage with authenticated-customer matching and safe v1 migration.
- New public booking/support/account/message request IDs no longer embed customer IDs. Rendered request receipts use opaque public IDs even when the underlying migrated request used an older identifier.
- Locally-created Hub request receipts are sanitised before first render, not merely before persistence.
- Added `HUB_PRIVACY_THREAT_MODEL.md` and cumulative `TITAN_MOBILE_HUB_CHECKPOINT_P29_P32.json`.
- Historical Pass 32 limitation — superseded by Pass 33, which adds authenticated encrypted-at-rest local repositories.


### Fail-closed surface bootstrap
The shared Flutter binary no longer defaults an invalid or missing `TITAN_SURFACE` to `zero`. Only explicit `zero`, `go`, or `hub` values open a product surface. Missing/unknown values render a non-operational configuration screen so a misconfigured Hub build cannot accidentally expose the owner surface.


## Pass 33 — encrypted local workforce, command and evidence repositories
- Replaced plaintext sensitive-state persistence with `TitanEncryptedJsonStore`: AES-256-GCM authenticated ciphertext files, per-record keys kept in platform secure storage, fresh nonces, associated-data binding to the logical repository key, hashed filenames, and staged temp/backup writes.
- Added `PlatformTitanSecureValueStore` for small key material only. Logical key names are SHA-256 hashed before secure storage so company/actor/device/surface identifiers are not exposed in physical key names.
- Android secure-key storage uses encrypted shared preferences for the current compatibility baseline; iOS key accessibility is `first_unlock_this_device`.
- Disabled Android auto-backup so encrypted local files are not restored without their device-bound key material.
- Migrated offline Command Bus queue, owner/Go workforce threads, Hub threads/requests, trust/autonomy, decisions, owner attention, field day/route/handoff/execution state to authenticated encrypted repositories.
- Hub v1/v2 and other legacy SharedPreferences stores are now migration-only. Plaintext is deleted only after the encrypted replacement commits successfully.
- Added an encrypted evidence vault. Camera/scanner/signature source files are encrypted with AES-256-GCM into hashed `.tze` files; metadata is independently encrypted; source plaintext is deleted only after both encrypted binary and metadata are safely committed.
- Evidence ciphertext is bound to its scope/hashed filename with AES-GCM associated data. Evidence Command Bus payloads continue to use only `local_evidence_ref`, never local filesystem paths.
- Capture UI now reloads encrypted evidence metadata and displays `encrypted local copy` rather than a device path.
- Encrypted state authentication failures and missing keys fail closed; the code does not regenerate a replacement key while trying to read existing ciphertext.
- Added storage protection metadata to Go's Field System Status checkpoint.
- Added dedicated encryption, tamper, migration, scope-key privacy, key-loss and evidence-vault regression tests.
- Current project compatibility is preserved with `flutter_secure_storage ^9.2.4` and `cryptography ^2.5.0`; a later platform-modernisation pass can raise Dart/Android baselines and upgrade the secure-storage major deliberately.

- Added the iOS Runner Keychain Sharing entitlement to Debug, Release and Profile configurations so the platform secure-storage key layer has the required iOS project capability.


## Pass 34 — deterministic offline replay and reconciliation
- Upgraded offline commands to replay schema v2 with queue sequence, per-target mutation revision, optional authoritative base revision, mandatory server recheck, `offline_contracted` authority, conflict key, evidence refs, supersession link, and persistent replay-attempt metadata.
- Upgraded the encrypted command store to `offline.command.queue.v4`, with migration from Pass 33 encrypted v3 and older plaintext v2.
- Added deterministic semantic idempotency for request/action/proposal/decision/evidence/handoff/plan mutations. Mutations without a semantic operation ID use their persisted command nonce so a legitimate later identical action is not permanently collapsed.
- Added `OfflineReplayContract` to verify scope, ordering, revision, target identity, authority contraction and evidence-reference integrity before any replay transport is called.
- Added an abstract `TitanOfflineReplayTransport`. Pass 34 deliberately does not fake server connectivity or replay success.
- Added encrypted replay receipts and encrypted conflict records.
- `accepted` becomes `server_confirmed` only when the server returns an authoritative receipt. Revision-bound accepts also require a returned server revision.
- Authoritative rejection also requires a server receipt. Invalid accepted/rejected responses are downgraded to retryable and stay queued.
- Retryable mutations remain queued and persist attempt count/time. Later mutations for that same conflict key cannot overtake them in the same replay cycle.
- Server conflicts move into the encrypted conflict repository and block later same-target mutations across reconnect cycles until explicitly resolved.
- Added explicit discard, resolve-elsewhere and rebase resolution. Rebase requires user confirmation, authoritative server revision, remains `offline_contracted`, and is rechecked again.
- Quote decisions and owner decision approval/rejection cannot be rebased onto changed revisions; a fresh human decision is required.
- Added reconciliation and reconnect orchestration services returning queue/conflict/receipt state without claiming network availability.
- Go Field System Status now verifies the deterministic replay schema and contracted offline authority.


## Pass 35 — reconciliation provenance and conflict UX
- Added a surface-aware Sync & Reconciliation Center to Command, Go and Hub.
- Added a lightweight home sync strip beneath the existing exactly-three workforce cards; it is deliberately not a fourth card.
- Command and Go can inspect queue sequence, mutation/base/server revisions, authority state and conflict provenance for their authorised local scope.
- Internal conflicts open an explicit review sheet. Rebase requires a second explicit confirmation and an authoritative server revision; discard also requires confirmation.
- No `Retry now` control is exposed because local UI must not pretend that a Titan server connection exists. Retry is represented as `retry on reconnect`.
- Hub receives a separate customer-safe projection. Capability IDs, revisions, receipts, conflicts, authority state, evidence refs, internal agent identifiers and internal replay reasons are removed.
- Hub filters any non-`hub.*` reconciliation record before both counts and rendering.
- Hub conflict UX is reduced to customer-language `needs review` plus `Contact support`; no rebase/discard/internal control is projected.
- Added opaque SHA-256-derived public references so customer status views do not display raw internal command/receipt/conflict identifiers.
- Reconciliation summary counts now use only the latest replay receipt per command. Historical retries remain audit history instead of inflating current retry counts.


## Pass 36 — authenticated server sync and connectivity lifecycle
- Added an opt-in authenticated server-sync runtime. Without `TITAN_SERVER_BASE_URL`, Command/Go/Hub stay local-first and create no server-sync network traffic.
- Production server sync requires HTTPS. Plain HTTP is accepted only for explicitly enabled localhost development; embedded URL credentials are rejected.
- Added secure session access-token storage through Titan's platform secure-store boundary. Tokens are not accepted through dart-defines or URLs.
- Added injectable HTTP transport plus a concrete `dart:io` client with request/connect timeouts, redirect suppression and a 2 MiB response cap.
- Added authenticated health probing and server replay. Replay requests carry canonical command scope, deterministic idempotency and optional remote evidence bindings.
- Server responses must echo command ID, idempotency key and `company_id`; mismatches fail closed as retryable.
- Added encrypted durable lifecycle states for probing, online, replaying, reconciled, backoff and auth-required. Backoff timestamps/failure counts survive app restart.
- Authentication expiry is not treated as generic connectivity failure: replay stops in `authRequired` until credentials are updated.
- Added a Flutter lifecycle observer and host controller for start/resume plus explicit connectivity/credential events.
- Added an encrypted evidence upload registry and prepare → HTTPS upload → complete handshake before evidence-bearing command replay.
- Evidence upload includes byte length and SHA-256 digest, has a 25 MiB default ceiling, rejects credential-bearing upload-ticket headers, and never sends a local filesystem path.
- Evidence becomes locally `synced` only after the replayed command receives an authoritative server acceptance. A server-accepted/local-commit failure remains safely retryable through the same idempotency identity.
- Pass 35 reconciliation views now surface configured connection state. Local-only builds remain quiet; Hub receives only customer-safe lifecycle wording with no raw lifecycle enum or retry timestamp.


## Pass 37 — token refresh, re-authentication and inbound Signals
- Upgraded secure server credentials from a single access token to a v2 access/refresh session bundle with expiries, credential generation and legacy v1 migration.
- Added a shared single-flight refresh provider. Health, replay, evidence and Signal transports can refresh once after a 401/403 and retry the exact scoped operation.
- Refresh responses must echo the exact `company_id + actor_id + device_id + surface`; mismatched refreshed credentials are never persisted.
- Expired/revoked refresh credentials are cleared and the durable lifecycle enters `authRequired`. `SessionReauthenticationService` provides the integration boundary for real sign-in and can immediately resume reconciliation after new credentials are stored.
- Added authenticated cursor-based inbound Signal pulling after outbound replay.
- Inbound Signals are exact-scope and surface-authorised. Hub cannot receive workforce-internal Signal classes.
- Signal payloads cannot carry competing tenant/session scope, tokens, cookies or local filesystem paths.
- Signals never directly patch CRM/domain state. They create encrypted projection-refresh hints and rerun existing authorised surface loaders.
- Added a separate encrypted `ServerSignalRevisionRepository`; the bounded Signal inbox is no longer a second revision authority.
- Signal IDs deduplicate redelivery, stale revisions are ignored, revision gaps force projection refresh, and post-inbox/pre-cursor crashes self-heal when the page is redelivered.
- Projection refresh hints are monotonic and survive failed reloads. They clear only after the relevant Command/Go/Hub projection refresh succeeds.
- Pass 35 sync UX can show safe received-update counts. Hub still cannot see raw Signal IDs, payloads, revision gaps or internal lifecycle values.


## Pass 38 — authoritative server-backed read projections
- Added revisioned server projection reads for Command owner attention/decisions, Go workforce state, and Hub customer/commercial state.
- Projection responses are exact-scope validated and conditionally fetched with known revision + ETag.
- Added encrypted per-kind projection cache with freshness TTL, 304 revalidation and stale-cache offline fallback.
- Raw server payloads are decoded into existing typed Titan models and re-encoded canonically before cache persistence, dropping unknown fields.
- Go server snapshots are additionally bound to the authenticated worker and embedded action payloads are allowlisted.
- Hub server snapshots/commercial data continue through existing Hub privacy contracts.
- Configured-server mode no longer silently falls back to demo business truth when no authoritative/cache data is available.
- Server sync configuration is attached before initial business-data loaders run.
- Pass 37 Signal hints now refresh only relevant server projection kinds and remain durable until every required authoritative refresh plus surface reload succeeds.


## Pass 39 — projection freshness, partial reads and durable refresh
- Added per-kind freshness and hard-stale policies. Go workforce data now has a deliberately short offline lifetime; Command and Hub projections use longer surface-appropriate windows.
- Configured-server reads now distinguish current, recent encrypted cache, too-old cache and unavailable data.
- The existing sync/status strip exposes freshness without adding another home card. Hub receives safe freshness wording/counts but not exact server snapshot or refresh timestamps.
- Added authorised partial projection sections and strict section echo validation. Partial data merges into an existing canonical full cache and is revalidated/re-encoded before persistence.
- Signal invalidation now uses one canonical dependency graph and can refresh only the affected projection sections.
- Added encrypted per-kind refresh scheduling with durable success cadence and capped failure backoff.
- Added an app-active refresh loop that sleeps until the next due read and pauses while the app is inactive. It does not claim OS background execution while suspended.
- Added an encrypted per-entity read ledger separating latest observed Signal revision from latest revision actually resolved by successful projection refresh.


## Pass 40 — production read adapter/API contract
- Added shared `TitanAuthoritativeCrmReadAdapter` and `TitanMobileReadAuthorization` server contracts. `company_id` remains the only tenant boundary; row authorization is a separate mandatory stage.
- Projection builders now receive `TitanAuthorizedCrmReadAdapter`, never raw CRM access, preventing cross-actor aggregation in generated mobile projections.
- Added deterministic projection generation/ETag contracts and a CRM-backed Hub commercial reference builder.
- Added authenticated entity detail and paginated entity collection APIs with exact scope, conditional revision/ETag reads, bounded cursors and surface entity-type authorization.
- Added server- and client-side entity payload filtering plus encrypted entity detail cache and revision monotonicity.
- Signals can opportunistically prefetch an authorised changed entity before refreshing its aggregate projection.
- Split gateway business reads into explicit `LocalMvpBusinessReadSource` and `ServerAuthoritativeBusinessReadSource`; production-configured reads no longer contain hidden per-method demo fallback logic.
- Added executable reference API and JSON fixtures whose output is consumed by the real mobile transports/codecs/caches in end-to-end contract tests.


## Pass 41 — authoritative write coherence
- Added the write-side causal contract from authenticated mobile Command through mutation authorization, atomic CRM/domain commit, server receipt, durable change event, projection revision advancement and Signal fan-out.
- Accepted replay now always requires an authoritative server revision. Reference accepted responses additionally carry entity/change-event/Signal/projection trace metadata, which is persisted into the encrypted mobile replay receipt.
- Added an idempotent transactional-outbox reference model: retry after a post-commit crash resumes propagation and never applies the business mutation twice.
- Added one authoritative mutation registry covering every offline-queueable business/workforce state capability; evidence capture/upload commands are explicitly classified as the separate evidence path.
- Projection generation can now read the same materialized revision ledger advanced by accepted mutations.
- Signal fan-out is audience- and surface-authorised: owner Zero, assigned Go worker and owning Hub customer receive only entity classes permitted to their surfaces.


## Pass 42 — materialized read-model recovery
- Added a company-scoped ordered SHA-256 change-history chain so accepted mutations have a replayable recovery order, not just standalone change-event IDs.
- Materialized projections are now actor-bound and carry projection revision, source sequence, source event hash, payload checksum and materialization time.
- Added live materialization after accepted authoritative changes and a serving path that verifies checksums before returning full or partial projections.
- Added deterministic company recovery: verify history, replay projection impacts, reconstruct revision state, detect missing/corrupt checkpoints, and regenerate through the normal authorised projection builders.
- Added company rebuild leases and audited rebuild-run records.
- Signal outbox publication now has a target-local sequence/cursor for each company/actor/device/surface, with a client fail-closed guard for non-advancing server cursors.
- Accepted replay receipts now include the exact ordered `change_sequence`, connecting the mobile receipt to the historical recovery source.
- Added a MySQL 8 reference schema for receipts, change history, projection revisions/materializations, Signal outbox and rebuild control.


## Pass 43 — Laravel production integration
- Added `backend/laravel/`, a Laravel 10 / PHP 8.3 / MySQL integration layer for the Pass 40–42 server contracts.
- The real CRM is connected through `AuthoritativeCrmAdapter`; no parallel Titan CRM tables were invented.
- Added mandatory authenticated `ExecutionScopeVerifier`, row-level `EntityReadAuthorization`, mutation authorization and Signal audience interfaces.
- Projection builders now receive `AuthorizedCrmReader`, preserving server-side actor isolation.
- Added lock-serialized company change heads, idempotent projection event applications, actor-bound materialized projections, target-local Signal cursors, rebuild leases/audits and propagation-failure records.
- Added durable propagation/rebuild/optional Signal-delivery queue jobs and Artisan operations.
- Added authenticated `/v1/mobile` replay/projection/entity/Signal/health controllers with surface policies.
- PHP syntax lint and pure-PHP contract smoke checks pass; PHPUnit and Flutter/Dart execution remain unavailable in this environment.


## Pass 44 — concrete host adapters and production projections
- Added configurable Eloquent bindings for the existing Titan Zero customer/job/service/quote/invoice/request/workforce/route/schedule/decision models; no duplicate CRM tables were added.
- Added built-in authenticated principal scope verification, worker/customer row authorization, mutation authorization, multi-device subscriptions and Signal audience resolution.
- Added all five canonical production projection builders: owner attention, decisions, Go workforce, Hub snapshot and Hub commercial.
- Added `titan:mobile:validate-host --json` so live deployment fails before traffic cutover when model classes, columns, revision fields, database connections, mutation mappings or projection builders are incomplete.
- Added PHP-generated projection fixtures plus a Dart codec compatibility suite to detect backend/mobile schema drift.
- Hub now handles a real no-upcoming-service projection without permitting reschedule/cancel/access/message mutations against a nonexistent service.


## Pass 45 — Go idle state and host discovery
- Go now has a first-class `active` / `idle` workforce state. An unassigned worker no longer receives a fabricated job, route, access state, departure brief or execution plan.
- Idle Go preserves exactly three staff cards while restricting them to non-job-specific Operations, Schedule and Job Prep actions.
- Job-bound Go entry points fail safely when idle, and the readiness sheet explains the idle state.
- Added PHP-generated active/idle Go fixtures and Dart codec round-trip tests.
- Added non-destructive Laravel host discovery, confidence scoring, mutation-field gap analysis and actionable integration planning.
- `titan:mobile:discover-host` and `titan:mobile:plan-host` write proposals only under `storage/app/titan-mobile`; they never overwrite live configuration.
- `titan:mobile:validate-host --json` remains the production acceptance gate.


## Pass 46 — live-host cutover gate
- Added reviewed host-mapping approval/activation by exact SHA-256 without overwriting repository config.
- Added non-mutating Zero/Go/Hub sample principal, authorised-read and direct projection probes.
- Added materialized projection coverage/lag, infrastructure and strict propagation health gates.
- Added SHA-addressed deployment-readiness reports and expiring ready-only cutover approvals.
- Every mobile HTTP route is now fail-closed behind a two-key gate: the traffic env flag plus a valid approval.
- Added immediate cutover revocation and append-only cutover audit logging.


## Pass 47 — post-cutover production operations
- Added closed/canary/general staged rollout with exact device overrides and company wildcards.
- Added critical queue-worker heartbeat jobs; stale/missing propagation workers now close live mobile traffic.
- Added a durable runtime rollback guard. Repeated production-health failures trip the guard and close traffic until an operator explicitly clears it.
- Added schema/migration compatibility generation 47 and a production deployment pulse with MySQL history plus SHA-addressed reports.
- Added client/server protocol negotiation (`API 1`, client contract `47`). HTTP 426 is retryable for offline replay and never discards a queued mutation.


## Pass 48 — observability and incident recovery
- Added end-to-end mobile correlation IDs. Mutation replay preserves one command correlation through the verified scope, authoritative change, receipt and generated Signal.
- Added structured request metrics that attribute a company only after authenticated scope verification; actor/device IDs are not stored in the metrics table.
- Added rolling per-company failure budgets and automatic incident bundles for budget exhaustion, propagation failure, Signal delivery failure and runtime-guard trips.
- Incident bundles pass credential/path redaction before storage.
- Incident recovery resumes already-committed propagation or rebuilds projections from authoritative history; it never replays the CRM mutation and each recovery generation is idempotent.
- Added an authenticated owner-only `/operations/status` diagnostic control plane plus Command/System UI with healthy, degraded, canary-limited and rollback-guarded states.


## Pass 49 — Titan Mobile Edge Node
- Command, Go and Hub now instantiate one shared device Edge runtime.
- Added persistent company-bound node identity, native iOS/Android resource telemetry, capability advertisement/fingerprints and fail-closed enrollment contracts.
- Added SHA-verified local model storage/registry, but the build does not claim a real on-device LLM runtime until one is integrated.
- Added encrypted company/surface-scoped local RAG and allowlisted offline device retrieval.
- Added encrypted Storage Fabric role manifests; phone data is explicitly projection/cache/working-set/staging/RAG/model storage rather than canonical business truth.
- Added encrypted Local Bridge trusted-peer state; discovery never implies trust.
- Command/System now shows local Edge Node state without adding a fourth proactive home card.


## Pass 50 — Merge80/mobile distributed-architecture convergence
- Physically re-verified canonical Merge80 and rescanned the live v96 roadmap before adding new mobile contracts.
- Added mobile compatibility bridges for Merge80 operation identity, Interaction Engine, Interface Runtime, offline policy, autonomy contraction, LocalBrain, event ledger, workforce governance, native storage, Knowledge Authority and Visual Runtime.
- Added trusted Local Bridge pairing/deep-link bootstrap, HTTPS identity verification and local Edge Hub intelligence client contracts.
- Added encrypted vector storage/search plus local embedding and hybrid-RAG contracts.
- Added a privacy/cost route planner enforcing device → trusted local computer → permitted external tiers, with explicit approval required for Titan-metered use.
- Recorded canonical gaps for Goals49–51 and created the Pass51–Pass60 mobile convergence plan without duplicating Builder 5's active Goal48 work.


## Pass 51 — canonical operation causality
- Wired mobile conversations into Merge80-compatible operation, Interaction, Interface Runtime, LocalBrain-request and Capability Router proposal contracts at the shared gateway seam.
- Added encrypted noncanonical operation journaling so conversation, queued mutation, authoritative replay result and inbound Signal can be correlated without granting authority.
- Upgraded new offline commands to causality schema 3 while preserving `offline_contracted` and mandatory server recheck.
- Corrected the Flutter/Laravel replay-envelope mismatch: Laravel now unwraps the nested `command`, normalizes historical Dart `id` to `command_id`, and verifies operation header/body causality.
- Authoritative mutation/change/Signal paths now preserve operation/request/correlation/trace identity end to end.


## Pass 52 — canonical Edge client, fail closed until Goal49 exists
- Re-scanned the live Agent Mesh roadmap before implementation. Goal49 SG01/SG02 remained TODO and unclaimed, so mobile did not create a competing Edge registry.
- Local Edge identity can no longer self-promote to `active`; a verified canonical control-plane receipt is mandatory.
- Added opt-in enrollment/heartbeat transport, encrypted control-plane state, nonce-bound heartbeat receipts, capability fingerprint publication, revocation/compromise/re-enrollment directives and stale-heartbeat contraction.
- Distributed Edge workload execution now requires both local active identity and fresh canonical control-plane enrollment status.
- Foreground heartbeat pulse is lifecycle-bound to Zero/Go/Hub; background wake remains scheduled for Pass59.


## Pass 53 — native Local Bridge federation lane
- Added Android DNS-SD and iOS Bonjour discovery for `_titan-edge._tcp`; discovery remains explicitly untrusted.
- Pairing-code/HMAC validation now creates only `pairingRequested`. Trust requires a second challenge over certificate-pinned private HTTPS.
- Raw Bridge session credentials are stored only in secure storage; peer metadata holds a token reference.
- Added pinned health/capability refresh, freshness-aware selection and explicit revocation.
- Private Bridge workload execution is read/compute-only, digest-bound and requires a receipt with `data_egress=local_network` and `authority_effect=none`.
- Mutation-shaped capabilities are rejected before network execution. Any business change still goes through Titan Command Bus.
- Hub cannot discover, pair or use private business Local Bridge nodes.
- Owner setup stays inside System detail; the exactly-three-home-cards invariant remains unchanged.


## Pass 54 — real on-device inference boundary
- Replaced the unavailable local-AI provider in the mobile Edge runtime with a GGUF/llama.cpp provider adapter.
- Local model execution is resource-gated, full-SHA verified immediately before use, run off the UI thread in a worker isolate, timeout-bounded and provenance-tagged as device/no-egress/customer-compute/authority-none.
- Added governed Ed25519-signed model-pack manifests with trusted issuer keys, exact size/hash binding and required licence identity.
- Corrected the authority boundary: purely local private RAG/LLM work may operate offline/unregistered, while revoked/compromised identities are blocked and distributed work still requires canonical Edge enrolment.
- Failure remains local. There is no automatic BYO/Titan/cloud fallback.
- Native llama.cpp binaries and physical-device execution remain release/platform packaging gates rather than being falsely represented as complete.
- Local embeddings remain deliberately unavailable until Pass55.


## Pass 55 — embeddings, encrypted hybrid RAG and Knowledge Authority sync
- Activated a real `llama_cpp_dart` embedding provider behind the existing local embedding contract.
- Added model-version/hash fingerprints so vector spaces cannot silently mix after model replacement.
- Extended encrypted vector storage to chunk-level records with chunk/content hashes and atomic document replacement.
- Hybrid retrieval now uses lexical + vector Reciprocal Rank Fusion, preserves semantic-only matches and deduplicates by document.
- Knowledge Authority mobile projections now enforce provenance, version, freshness, contradiction, expiry, company and surface rules at ingestion and again at retrieval.
- Added delete/supersede cleanup, complete-snapshot pruning, monotonic encrypted sync cursors and idempotent replay.
- Hub cannot ingest company-private business knowledge.
- Embedding/runtime failure remains local and degrades to encrypted lexical search; there is no cloud embedding fallback.
- Pass55 is the midpoint P51–P55 cumulative convergence checkpoint.


## Pass 56 — Storage Fabric topology + sovereign provider execution
- Mobile now consumes a versioned, company-scoped Storage Fabric topology instead of assuming Titan Cloud or the phone owns business data.
- Each data class must resolve to exactly one canonical transactional endpoint; mobile treats canonical and transactional replica endpoints as status-only and never connects to them directly.
- Google Drive, Dropbox, OneDrive and SharePoint are enforced as non-transactional document/archive/backup-style destinations.
- Added encrypted device/local-filesystem binary storage plus Core-issued ephemeral transfer-ticket execution for NAS, S3, S3-compatible, MinIO, customer VPS and customer document/archive providers.
- Provider API keys/passwords remain outside mobile. Transfers are operation-, endpoint-, role-, object-, expiry-, size- and SHA-256-bound.
- Backup/evidence/archive failover is allowed only among endpoints already authorised by canonical topology. Restore is staging only; mobile cannot promote any source to canonical.
- Existing evidence upload authority is reused behind a Storage Fabric destination-health preflight.
- The default mobile provider factory deliberately excludes Titan-managed storage, preventing hidden managed-storage fallback/cost.
- Repaired an inherited malformed Knowledge Authority method splice found in the Pass55 cumulative source before Pass56 implementation.


## Pass 56 — sovereign Storage Fabric execution
- Added canonical topology consumption with transactional/object/document/projection data-class kinds and exactly one canonical owner per routed class.
- Mobile can execute only bounded projection/cache/evidence/backup/archive roles; direct canonical/replica database access is denied.
- Added encrypted device/local-filesystem storage plus delegated HTTPS adapters for NAS, S3/S3-compatible, MinIO, customer VPS and customer document/archive providers.
- Delegated transfers require short-lived Core tickets, endpoint host allowlists, HTTPS/private-LAN policy, byte bounds and SHA-256 receipts.
- Drive/Dropbox/OneDrive/SharePoint may serve document/archive roles but cannot be treated as transactional CRM databases.
- Recovery reads authorised sources into encrypted staging only; the phone cannot promote a backup to canonical state.
- Evidence remains staged when no healthy authorised evidence destination exists.
- No automatic Titan-managed storage fallback was added.
