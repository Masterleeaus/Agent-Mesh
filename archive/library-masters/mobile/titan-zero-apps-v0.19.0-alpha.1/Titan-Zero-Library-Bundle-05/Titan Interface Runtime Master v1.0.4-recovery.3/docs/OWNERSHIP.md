# Ownership

Interface Runtime owns semantic interface execution, contribution discovery, validation/repair, component-tree normalisation, bindings/state semantics, actions-as-intents, projection binding, surface-aware presentation and safe fallback.

It does **not** own component authoring (Builder), presentation intent (Interaction Engine), visual effects/media execution (Visual Runtime), or business/domain authority.

## Canonical company boundary
`company_id` is the sole tenant/company isolation boundary. Legacy tenant identifiers may be accepted only as compatibility inputs, normalized to company context, and rejected when they conflict with `company_id`.
