# Presentation Model & Titan Builder Adapter

Pass 7 introduces Presentation Model v1.0. Titan Interface Runtime owns the **composition metadata**, while Titan Builder remains the optional source of presentation component vocabulary.

## Boundary

- Interface Runtime may ask for a component by `renderer_hint` / `component_hint`.
- `TitanBuilderComponentVocabulary` resolves Builder's existing `ComponentRegistry` through the Laravel container using a soft contract reference. Titan Builder is not a required dependency.
- Builder definitions are accepted only when `authority= presentation-only`, `accessible=true`, and, when required by the responsive policy, `responsive=true`.
- Builder action declarations are never copied across the adapter boundary. Mutations remain governed capabilities / Interaction Engine operations.
- Missing Builder, unknown components, malformed components and policy-denied components resolve to deterministic safe fallbacks. If no Builder fallback is available, the internal `safe-container` primitive is used.

## Stable tree

`PresentationTree` contains:

- model version `1.0`;
- product surface (`command`, `go`, `hub`, `onboarding`);
- one `PresentationNode` root;
- `ResponsiveHints`;
- presentation-only metadata.

Associative values are recursively key-sorted before canonical JSON serialization. Explicit child/list order is preserved. `fingerprint()` is SHA-256 over canonical JSON, making semantically equivalent trees deterministic across composition order.

## Default container fallbacks

| Container | Preferred Builder component |
|---|---|
| chat | `chat-thread` |
| card | `entity-card` |
| panel / full-workspace / canvas | `stack` |
| drawer | `drawer` |
| wizard | `form-wizard` |
| board | `kanban-board` |
| map | `stack` fallback; Pass 13 Spatial Workspace composes the dedicated Maps-authoritative map presentation |
| calendar | `data-list` (view switching arrives in Pass 12) |
| timeline | `timeline` |
| table | `table` |
| report | `report-shell` |
| modal | `modal` |

The installed Website1408 Titan Builder snapshot used during Pass 7 contained 125 component definitions; all 125 passed the presentation-only, responsive and accessibility policy checks.
