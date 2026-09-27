# Facet Registry & Object Workspaces

Pass 6 introduces the metadata layer that lets one registered object be enriched by multiple extensions without transferring data authority.

## Contribution model

A facet declares `applies_to` object keys. The target may be owned by the same extension or another installed contributor. Discovery validates the facet's shape; the global facet registry validates that every target object actually exists after the object registry has been built.

Facet keys are globally unique. Collisions fail closed. A contributor whose active facet references an unavailable object is rejected from the active facet registry so no dangling workspace slot is emitted.

## Canonical facet order

Workspaces use the stable kind order:

`summary → activity → relationship → messages → money → evidence → files → notes → audit → automation → recommendations → approvals → data → custom`

Facets of the same kind are ordered by key. This makes composition deterministic regardless of extension discovery order.

## Visibility and authorization

A facet is eligible only when:

1. its `product_surfaces` includes the current product surface;
2. Hub exposure is explicitly `customer_safe=true`; and
3. every declared facet permission exists in the authenticated `InterfaceContext.capabilities` list.

Object-level permissions are also checked before a workspace can be composed. These checks are presentation gates, not source authorization; authoritative read adapters must re-authorize when payload loading is implemented.

## Lazy loading

Pass 6 intentionally emits only `FacetSlot` metadata with `loading=lazy` and `payload=null`. Interface Runtime does not query CRM, Field, Finance, Connect, Maps or other business models to populate a facet. Pass 8 read-authority adapters will load authoritative payloads without changing the workspace ownership boundary.
