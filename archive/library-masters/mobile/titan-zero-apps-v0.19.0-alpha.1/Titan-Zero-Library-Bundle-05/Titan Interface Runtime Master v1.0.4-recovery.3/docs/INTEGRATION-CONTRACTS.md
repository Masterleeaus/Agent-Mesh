# Integration Contracts

Stable PHP contracts currently include:

- `InterfaceContributionRegistryContract`
- `InterfaceContributionDiscoveryContract`
- `AuthenticatedContextPrincipalProviderContract`
- `InterfaceContextResolverContract`
- `InterfaceContextStoreContract`
- `DomainRegistryContract`
- `ObjectRegistryContract`
- `ActionRegistryContract`
- `ContextInspectorContract`
- `CommandSurfaceContract`
- `NavigationProjectorContract`
- `PresentationComposerContract`
- `ReadAuthorityAdapterContract`
- `GovernedActionDispatcherContract`
- `ReceiptPresenterContract`

## Context integration

Host authentication/tenant middleware supplies trusted actor state. `AuthenticatedContextPrincipalProviderContract` converts it into a canonical security principal, and `InterfaceContextResolverContract` builds the full presentation context. Integrations may replace the principal-provider binding with another implementation, but must preserve fail-closed tenant/user semantics.

The runtime does not import concrete classes from CRM, Finance, Maps, Builder or Interaction Engine. Later adapters must target public contracts/ports only.


## Object integration

Contributors declare object metadata through Interface Contribution Contract v1.1 (with v1.0 compatibility). `ObjectRegistryContract` owns only normalization, collision detection, relationship topology and safe reference resolution. It does not fetch the authoritative object. Later read adapters receive a resolved object descriptor plus canonical Interface Context and must independently authorize and read from the owning service.

Cross-extension relationships use registered object keys in `relationship_refs`. Unknown, collided or otherwise unavailable targets fail closed instead of being silently ignored.

## Read authority integration

Pass 8 adds:

- `ViewRegistryContract`
- `LegacyDataSurfaceRegistryContract`
- `ReadAuthorityRouterContract`
- `ReadCacheContract`
- `InterfaceReadModelProviderContract`
- `CapabilityReadGatewayContract`
- `LegacyRouteLocatorContract`
- `DataModeProjectorContract`

An authoritative extension that wants to satisfy `read-model` views binds `titan.interface.read-model.<authority>` to an implementation of `InterfaceReadModelProviderContract`. The provider receives the canonical `InterfaceContext`, opaque declared reference and bounded criteria array, and remains responsible for domain authorization and tenant-safe querying.

A host governance/capability layer may replace the default `NullCapabilityReadGateway` with a `CapabilityReadGatewayContract` implementation. Interface Runtime does not infer that a displayed capability is executable or authorized.

## Inspector/action integration

Domain extensions declare actions in Interface Contribution Contract v1.1; v1.0 declarations remain accepted during migration. v1.1 Hub actions additionally require `customer_safe=true`. `ActionRegistryContract` validates and filters those declarations; it does not execute them. Mutating actions must reference either `capability_ref` or an Interaction Engine wizard/journey. The inspector and command surface expose those references as `executable=false` intents so the consuming Titan shell can hand them to the appropriate governed execution path.

The inspector may show any registered object that passes object/workspace authorization for the canonical `InterfaceContext`. Full-workspace escalation preserves the same tenant/user/product-surface/trace/correlation identity.

## Governance / trust lifecycle

- `GovernanceStateProviderContract` — source authority supplies trust/governance lifecycle state.
- `GovernanceStateGatewayContract` — tenant/user revalidated soft provider gateway.
- `GovernanceWorkspaceContract` — presentation-only trust lifecycle composition.
- `ReceiptPresenterContract` — reusable source receipt presentation.

Bindings use `titan.interface.governance.{extension-key}` with a global `titan.interface.governance` fallback. Current host fallback reads TitanAI approvals only through `ApprovalQueue`; receipt and rollback state is never fabricated or read via direct SQL.


## Working set integration

- `WorkingSetGatewayContract` — read-only access to the authoritative workspace grouping source.
- `WorkingSetDomainItemVerifierContract` — revalidates business-domain membership against current host/business context.
- `WorkingSetWorkspaceContract` — composes the mixed-object presentation/context envelope.

The current host adapter reads existing `TitanWorkspaceProject` records owned by the authenticated user. For business-domain membership it uses `titan.assist.context` as the current-business verification bridge. Membership rows are never authorization evidence. Interface Runtime does not create, attach, detach or delete working-set rows directly; any future mutation remains a source-authority handoff.
