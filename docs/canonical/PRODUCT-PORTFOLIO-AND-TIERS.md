# Titan Zero Product Portfolio & Commercial Tiers

Status: canonical productization detail under Blueprint v3  
Date: 2026-09-28  
Canonical architecture: `docs/architecture/TITAN-ZERO-BLUEPRINT-V3.md`  
Productization mission: #1042

## 1. Productization principle

Titan is one evidence-backed, governed business platform exposed through multiple customer-facing products and channels.

Do not implement Titan Zero, Go, Hub, external AI hosts, WordPress or Omni as independent business cores. They consume the same company identity, Business Evidence Ledger, Business Reality projections, Personal Zero, Workforce, capability registry, Interaction layer and governed execution path.

Canonical business surfaces remain:

- `zero` — owner/manager;
- `go` — worker/field;
- `hub` — customer.

ChatGPT/Claude/external assistants, WordPress/Web Presence, Omni channels, DirectAdmin and other hosts are adapters, projections or control-plane providers.

## 2. Customer-facing portfolio

| Product | Primary user/job | Architectural form |
| --- | --- | --- |
| **Titan Zero** | Run the business from one owner/manager experience | Canonical `zero` projection |
| **Titan Go** | Run field work, offline workflows, evidence and guided procedures | Canonical `go` projection |
| **Titan Hub** | Customer self-service, status, approvals, invoices and support | Canonical `hub` projection |
| **Titan in external AI hosts** | Run Titan from ChatGPT, Claude or future assistants | Authenticated host/channel adapter over canonical capabilities |
| **Titan for WordPress / Web Presence** | Turn an existing website into an operational front door | Site/CMS adapter over Titan APIs and Hub/Omni capabilities |
| **Titan Omni** | Shared customer/worker messaging and voice across channels | Omnichannel projection over Interaction + communications contracts |

Higher-tier platform capabilities include **Titan Foundry**, **Titan Missions**, compliance/policy packs, Private/Sovereign Intelligence and Titan Server Node infrastructure controls. These are capabilities/deployment profiles, not extra business truth stores.

## 3. Commercial tiers

### Titan Solo — “Your business, in your pocket”

Target: solo operators and micro-businesses, typically 1–3 people.

Default bundle:
- Titan Zero with the Solo capability envelope;
- external-AI-host access;
- limited Titan Omni channels;
- core customer, booking, quote, invoice and asset-note workflows;
- local/device/BYO intelligence preferred where appropriate.

Not default-entitled:
- Titan Go team workflows;
- full Hub;
- Foundry;
- Missions;
- advanced compliance/policy packs;
- customer-administered sovereign infrastructure.

**Pricing hypothesis:** $49/month per business, including up to 3 users.

### Titan Team — “Your business, running itself”

Target: small field/home-service teams, typically 4–10 people.

Default bundle:
- full Titan Zero;
- Titan Go;
- basic Titan Hub;
- external AI hosts;
- broader/full Omni;
- basic WordPress/Web Presence integration;
- field/offline/evidence workflows;
- baseline compliance and approval flows.

**Pricing hypothesis:** $299/month per business, including up to 10 users.

### Titan Business — “Your business, with infrastructure”

Target: mid-market service businesses, multi-team/multi-location operations and project-heavy businesses.

Default bundle:
- Team capabilities;
- Titan Foundry;
- Titan Missions;
- composite and temporary applications;
- stronger compliance/evidence/policy controls;
- Policy Compiler subject to Constitution ceilings;
- capability-gap/digital-twin style analysis;
- managed cloud/private intelligence options as entitled.

**Pricing hypothesis:** $2,500/month per business, including up to 50 users, plus metered Foundry/Mission/resource usage where appropriate.

### Titan Sovereign — “Your business, on your infrastructure”

Target: enterprise, regulated, government-adjacent and customer-controlled infrastructure environments.

Default bundle:
- Business capabilities;
- Private/Sovereign Intelligence on customer-controlled infrastructure;
- stricter data-classification/locality/data-residency routing;
- customer-visible Titan Server Node / DirectAdmin Cockpit controls where authorized;
- advanced workforce, audit, recovery and Capsule capabilities;
- network/franchise deployment patterns where supported;
- contractual SLA/RTO/RPO profiles.

**Pricing hypothesis:** annual contract; the proposed $500k+ level is a positioning hypothesis and requires enterprise sales validation, infrastructure sizing and SLA/support costing.

## 4. Entitlement model

Commercial plan state must be versioned and separate from authority.

A canonical entitlement decision should resolve at least:

1. `plan_id` / commercial tier;
2. product/channel availability;
3. capability entitlement;
4. metered quota/funding/budget;
5. provider/locality eligibility;
6. user membership/seat policy;
7. feature-specific commercial terms.

It must **not** answer whether an actor is authorized to perform a consequential business action.

Canonical evaluation order:

`identity + company context → entitlement exposure → intent/capability resolution → risk/assurance → effective authority → governed execution → evidence → verification`

An entitled actor can still be unauthorized. An authorized actor whose subscription does not expose a capability cannot invoke it through the product. Neither condition may silently rewrite the other.

## 5. Upgrade paths

### Solo → Team
Typical signals:
- >3 active users;
- need for Titan Go;
- team dispatch/field coordination;
- Hub or broader web/Omni needs.

Upgrade behavior:
- entitlement change only;
- no customer/job/invoice data migration;
- same company identity, evidence history, Zero and Workforce.

### Team → Business
Typical signals:
- Mission-shaped project/campaign/crisis;
- compliance/audit requirement;
- multi-location/integration complexity;
- need for Foundry/composite apps/policy automation.

Preferred product behavior:
- present the concrete capability/outcome that solves the need;
- avoid generic “upgrade for more features” prompts;
- upgrade never self-executes.

### Business → Sovereign
Typical signals:
- data-residency/security review;
- customer-controlled infrastructure requirement;
- private model requirement;
- scale/recovery/SLA requirements.

Upgrade behavior:
- governed deployment/locality transition;
- same business identity and evidence chain;
- Capsule/Recovery semantics preserve portability;
- revalidate credentials, provider bindings and current authority.

## 6. Downgrade behavior

Downgrade must never destroy factual history merely because a paid capability is no longer exposed.

For capabilities no longer entitled, define one of:
- retained read-only access;
- export/portability access;
- grace period;
- archived historical visibility;
- disabled future mutation;
- explicit resource retirement for temporary infrastructure.

Mission closure and temporary-resource retirement must preserve required evidence and any permanently promoted business state.

## 7. Metering and billing neutrality

Titan should meter costly resources independently of the billing provider.

Potential meters:
- messages/SMS/voice;
- hosted inference tokens/compute;
- Foundry scans/builds/tests/deployments;
- Mission temporary runtimes/integrations;
- storage/backup;
- private GPU/runtime hours;
- premium external connectors.

Metering evidence must be auditable and company-scoped, but billing receipts do not become authority and should not be confused with domain Business Evidence.

Billing-provider integrations remain replaceable capability providers.

## 8. External AI hosts

“Titan in ChatGPT/Claude” is a first-class distribution/product entry point, not a separate AI brain.

Requirements:
- authenticate One and company context;
- expose tools from canonical capability registry filtered by current entitlement;
- evaluate execution authority separately;
- preserve conversation/work/correlation identity across host↔Titan transitions;
- support BYO/customer-paid model access where technically possible;
- never couple Titan architecture to one external model vendor.

## 9. WordPress / Web Presence

The website becomes an operational front door.

Capabilities may include:
- booking/intake;
- quote requests;
- Hub/account/status views;
- invoice/document views;
- Omni/chat entry points;
- service/catalog content projected from canonical Titan data.

WordPress remains an adapter. It must not create a second customer, booking, quote, job, invoice, auth or permission source of truth.

## 10. Titan Omni

Omni channels share:
- Interaction Engine intent/context;
- conversation identity/continuity;
- canonical customer/company context;
- capability routing;
- authority/execution boundaries;
- communications evidence.

A user/customer may change channels without creating a disconnected operational history.

Channel availability is entitlement; communication consent, actor identity and business authority remain independent controls.

## 11. Productization priorities

1. **Runtime boundary convergence first.** Guarantees only matter if production surfaces all reach the same canonical hosted runtime.
2. **Self-serve Solo onboarding.** Target under five minutes where integrations allow.
3. **Team onboarding.** Target same-day operational setup for standard field-service businesses.
4. **Business activation.** Use a concrete Mission/compliance/Foundry outcome as the upgrade/activation event.
5. **Sovereign deployment playbook.** Treat as a governed deployment project with environment, data, security, recovery and SLA acceptance.
6. **Entitlement observability.** Every capability exposure/denial should be explainable without exposing internal authority logic.
7. **No tier forks.** Never maintain separate Solo/Team/Business/Sovereign business engines.

## 12. Current honest assessment

The repository shows unusually strong architectural separation around interaction, decision, workforce, authority, evidence, locality and replaceable capability providers. The present productization risk is not lack of capability; it is coherent integration and packaging.

The commercial model should therefore optimize for:
- fewer concepts visible to customers;
- one canonical runtime and state model;
- explicit tier entitlements;
- fast onboarding;
- clear upgrade triggers;
- measurable unit economics;
- proof through real customer workflows.

The proposed prices are reasonable hypotheses for packaging discussion, but the repository does not by itself validate willingness-to-pay, support burden, communications cost, hosted-model cost, GPU cost, enterprise procurement cycle or SLA liability. Those must be measured before treating pricing as settled.

## 13. Superseded historical packaging

Historical references to **Titan Nano**, **Titan Pro**, or unrestricted/full-cloud-AI free packaging are superseded for current productization unless intentionally re-adopted through #1042.

Current commercial model:

`Solo → Team → Business → Sovereign`

Current architectural model remains:

`ONE → ZERO → WORKFORCE → GOVERNED EXECUTION → EVIDENCE → VERIFIED REALITY → ZERO`
