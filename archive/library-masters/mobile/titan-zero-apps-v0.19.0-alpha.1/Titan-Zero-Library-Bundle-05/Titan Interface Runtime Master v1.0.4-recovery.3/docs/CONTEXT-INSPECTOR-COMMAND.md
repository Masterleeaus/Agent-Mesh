# Context Inspector & Command Surface

Pass 11 introduces a presentation-only contextual inspector and command/search surface.

## Context inspector

`ContextInspectorContract` accepts a canonical `ObjectReference` plus the current `InterfaceContext`. It resolves only registered object metadata, verifies product-surface and tenant scope through `ObjectRegistryContract`, reuses `ObjectWorkspaceComposerContract` for object/facet permission checks, and derives a child context containing the selected domain/object reference.

The child context preserves tenant, user, roles, capabilities, product surface, trace ID and correlation ID. Choosing a full workspace therefore does not create a new security identity or lose trace context.

Inspector output contains:

- registered object metadata and canonical object reference;
- the lazy object workspace/facet slots;
- permission- and surface-filtered action references;
- a non-executable full-workspace target;
- a presentation-only drawer tree.

The inspector does not load authoritative business object payloads. Domain/read adapters remain responsible for reading and re-authorizing actual records.

## Action registry

Pass 11 materializes the Interface Contribution `actions` contract into `ActionRegistryContract`.

Actions are globally collision checked. Every `applies_to` object must exist in the active object registry. Runtime visibility requires the current product surface and every declared permission. Mutating actions are valid only when they reference an authoritative `capability_ref` or Interaction Engine wizard/journey.

The registry never dispatches an action. `InspectorActionReference` converts a declaration to a non-executable intent containing the object reference plus capability/interaction reference.

## Command surface

`CommandSurfaceContract` provides bounded registry/current-context search. It exposes only five command kinds:

- `ask` — sends the query/context onward to Titan Zero/AI presentation integration;
- `navigate` — opens a registered domain intent surface;
- `inspect` — opens the contextual inspector without forced full-route navigation;
- `workspace` — explicitly escalates the current object to the full object workspace;
- `action` — references a declared authorized action but does not execute it.

The command surface does not perform arbitrary business-record search in Pass 11. It searches interface registry metadata plus the current resolved object context. Future authoritative search providers may be added only through an explicit contract that preserves source authorization.

All command items serialize with `executable=false`. Protected mutations remain governed by capabilities / Interaction Engine / Command Bus paths.

## Routes

Authenticated runtime routes include:

- `GET /dashboard/user/titan-interface-runtime/commands?q=...`
- `GET /dashboard/user/titan-interface-runtime/inspect/{objectReference}`
- `GET /dashboard/user/titan-interface-runtime/workspaces/{objectReference}`

These endpoints are read/presentation surfaces only.
