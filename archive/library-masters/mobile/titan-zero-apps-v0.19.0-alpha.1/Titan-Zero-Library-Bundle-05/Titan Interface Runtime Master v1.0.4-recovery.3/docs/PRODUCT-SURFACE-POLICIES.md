# Product Surface Policies

Pass 18 makes Command, Go, Hub and Onboarding explicit presentation/security profiles over the same Interface Contribution registries. Product surface selection is resolved by the Context Spine from trusted route/runtime context; callers cannot mutate tenant, user, roles, capabilities or product surface through child context propagation.

## Surface profiles

| Surface | Audience | Density | Navigation | Primary-action budget | Hard rule |
|---|---|---|---|---:|---|
| Command | owner / manager | comfortable | full | 12 | advanced controls allowed only when declared permissions are satisfied |
| Go | field worker | compact, mobile-first | task-first | 5 | worker-only views/facets/actions require their declared field capabilities |
| Hub | customer | simple, mobile-first | customer journey | 4 | every object/view/facet/action must be explicitly Hub-visible; views/facets/actions require `customer_safe=true` |
| Onboarding | setup operator | progressive | stepwise | 3 | progressive disclosure keeps secondary actions available but out of the primary action set |

These presentation profiles never grant authorization. Descriptor `product_surfaces`, authenticated Context Spine capabilities, and Hub customer-safety remain authoritative filters.

## Central policy projection

`ProductSurfacePolicyProjector` produces metadata only:

- visible domains;
- authorized objects;
- per-object views;
- per-object facets;
- primary/secondary action references; and
- the active presentation profile.

No business payload is loaded and no action is executed. Action partitioning is a presentation concern only; primary and secondary actions remain governed non-executable intents.

## Fail-closed rules

1. Object resolution now checks object-level capabilities as well as product-surface visibility and tenant identity.
2. Views use one `visibleIn(InterfaceContext)` check for surface, Hub safety and capabilities before a read authority is invoked.
3. Facets and actions retain their existing surface/capability filters; Hub actions additionally require Interface Contract v1.1 `customer_safe=true`.
4. Switching product surface cannot occur through `InterfaceContext::with()`; the context must be re-resolved through the trusted route/policy boundary.
5. Product-surface policy never changes tenant, user, roles, capabilities, trace or correlation identity.

## Real Builder compatibility

The Website1408 Titan Builder snapshot already separates read-only DTO sources by audience, including owner (`crm-owner-*`), field (`crm-field-*`) and customer (`crm-customer-*`) sources with explicit required capabilities. Pass 18 consumes the same principle at runtime and does not copy Builder source logic.
