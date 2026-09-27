# Interface Contribution Contract

Titan Interface Runtime prefers **Interface Contribution Contract v1.1** and retains **v1.0** discovery compatibility so existing extensions are not broken by the rebase. Its own sidecar publishes only the `interface-runtime` platform domain and does not claim business objects or business actions.

## v1.1 typed relationships

v1.1 relationships are first-class definitions with a stable key and explicit semantics:

- `source_object_ref`
- `target_object_ref`
- `kind`: one-to-one / one-to-many / many-to-one / many-to-many / parent-child / association
- optional `inverse_ref`
- `customer_safe`

An object's `relationship_refs` reference these relationship keys. Relationship keys are globally collision checked; source/target objects and inverse references are validated after all active contributors are normalized. v1.0 direct object-target `relationship_refs` are converted to legacy relationship descriptors for backward compatibility.

## Hub action safety

v1.1 actions carry `customer_safe`. An action cannot be exposed on Titan Hub unless both its product-surface declaration and `customer_safe=true` permit it. Capability requirements are checked against the authenticated Context Spine. Mutating actions still require a governed `capability_ref` or Interaction Engine wizard/journey and remain `executable=false` inside Interface Runtime.

## Composition rules

- Domains have one declarative owner; duplicate domain ownership fails closed.
- Objects remain owned by their contributing domain extension.
- Cross-extension facets may enrich another object's workspace without acquiring record authority.
- Canonical tenant references use `object-key@tenant:object-id`; global references use `object-key:object-id`.
- The runtime composes metadata only. Authoritative data adapters re-authorize every read, and governed systems execute every mutation.
