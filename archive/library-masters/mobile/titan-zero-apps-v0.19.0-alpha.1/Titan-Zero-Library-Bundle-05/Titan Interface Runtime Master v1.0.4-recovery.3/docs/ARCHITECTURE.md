# Architecture

**Current baseline:** Manifest v2.2 · `ui-surface` · `titan.production.core.v1` · Interface Contract v1.1 preferred / v1.0 compatible.

Titan Interface Runtime sits between product surfaces and authoritative Titan services. It consumes declarative interface contributions and returns presentation metadata. It does not own business records or workflow state.

```text
Authenticated/trusted host context
        |
        v
Context Spine -> Domain extension -> Interface Contribution -> Interface Runtime -> presentation
                                             |-> Interaction Engine
                                             |-> Titan Builder vocabulary
                                             |-> read authorities / legacy data surfaces
Protected action -> governance / Interaction / Command Bus -> authoritative domain -> receipt
```

## Context Spine

`InterfaceContext` v1.0 is the canonical presentation context. Tenant, user, roles, capabilities, product surface, trace and correlation identity are immutable once resolved. Domain/object/workspace/journey selectors may derive child contexts without changing the security principal.

The Context Spine is **not** an authorization replacement. Domain/read/action adapters must still re-authorize the target object/capability against the canonical tenant/user context.

Pass 3 implements context resolution and propagation. Domain/intent registries begin in Pass 4.


## Pass 4 — Domain and intent registry

Validated contribution descriptors are normalized into `DomainDescriptor` values by `DomainRegistryContract`. Domain ownership is unique across extensions: duplicate keys are excluded from the active registry and reported in `DomainRegistrySnapshot::collisions`. Product-surface filtering happens before navigation projection. `NavigationProjectorContract` emits presentation metadata only and has no dependency on the Menu extension or business-domain model classes.


## Pass 5 — Object and relationship registry

`ObjectRegistryContract` normalizes declared object metadata independently of domain models. Object keys are globally unique across active interface contributors; collisions fail closed. `relationship_refs` use first-class typed relationship keys for v1.1 contributors. Each relationship declares source, target, kind, optional inverse and Hub customer safety. Legacy v1.0 direct object-target refs are normalized into compatibility edges. Global source/target/inverse validity is checked after every active contributor is known.

Tenant-scoped object references are canonicalized as `object-key@tenant:object-id`; global objects use `object-key:object-id`. Reference resolution checks registry availability, product-surface exposure, Hub customer-safety and tenant equality before any future authoritative read adapter is called. The reference identifier remains opaque to Interface Runtime.

## Pass 8 — Read authority and Legacy Data mode

`ViewRegistryContract` normalizes declared collection/read views. `AuthorizedViewReader` gates a view by active product surface, Hub customer-safety and authenticated capabilities before it may call `ReadAuthorityRouterContract`.

`ReadAuthorityRouter` supports only the declared modes `read-model`, `capability` and `legacy-route`. It never builds a domain SQL query. The router stamps canonical tenant/user/surface/domain/trace/correlation/query provenance and uses only request-local cache entries whose keys include security and workspace context.

Read-model providers are resolved through a fixed container binding namespace (`titan.interface.read-model.<authority>`) and must implement `InterfaceReadModelProviderContract`; manifest content cannot nominate an arbitrary PHP class. Capability reads pass through `CapabilityReadGatewayContract`. Legacy routes are reduced to named-route navigation metadata and retain their source middleware/policy authorization.

`LegacyDataSurfaceRegistryContract` plus `DataModeProjectorContract` preserve existing Laravel/MagicAI expert CRUD/table routes without copying controllers, query logic or policies. Hub legacy Data projection is disabled by default.

## Pass 11 — Context inspector and command surface

`ActionRegistryContract` normalizes declared action metadata and rejects global action-key collisions or unknown `applies_to` object targets. Visibility is filtered by product surface and authenticated capabilities. Mutating declarations must already point to a governed capability or Interaction Engine interaction; Interface Runtime never dispatches them while composing the inspector or command palette.

`ContextInspectorContract` resolves a canonical object reference, preserves immutable tenant/user/product-surface/trace identity, adds the selected domain/object to a child context, and composes the existing lazy object workspace inside a presentation-only drawer. Full-workspace escalation reuses that child context instead of starting a new authorization context.

`CommandSurfaceContract` searches registered domain intent surfaces plus the current object context and returns only non-executable Ask, Navigate, Inspect, Workspace and Action intents. It does not perform arbitrary business-record queries and does not become a Command Bus.


## Pass 11R — Blueprint / host compatibility rebase

The runtime now declares `ui-surface` plus universal production-core inheritance in Manifest v2.2. The root installer manifest is deliberately minimal and packaging is flat-root. Interface Contract v1.1 introduces typed relationships and action `customer_safe`; v1.0 remains accepted during migration. Exact-host compatibility is isolated behind authorization/menu/package adapters instead of spreading MagicAI host assumptions throughout the registry/composition code.

The legacy host-menu fallback is the sole narrow exception to the normal no-persistence rule: it may self-heal Titan Interface Runtime's own navigation metadata in the shared `menus` table. It cannot write CRM, Work, Finance, Maps, Interaction or other business state.

## Pass 15 trust boundary

Governance state flows source governance → Interface Runtime projection. Protected approval/execution/rollback flows Interface Runtime intent → authoritative governance/capability/Interaction route → source receipt. Interface Runtime does not become a governance decision point or durable receipt ledger.


## Pass 16 — Working sets and shared workspace context

`WorkingSetWorkspaceContract` composes mixed-object working sets from the host Titan Workspace Project authority. Workspace membership is a contextual relationship only; it never grants read/write permission over a referenced domain object. Business items are product-surface/capability filtered and then reverified through the host `titan.assist.context` bridge before a canonical object reference enters the shared context envelope. The derived `InterfaceContext` adds only `workspace_id`; tenant, user, roles, capabilities, product surface and trace/correlation identity remain immutable.

Interface Runtime stores no working-set membership table and executes no membership mutations. Detach/remove operations are presentation-only handoff intents and explicitly cannot delete authoritative domain data.
