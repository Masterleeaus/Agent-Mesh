# Governance

Presentation never grants authority. Any mutating action surfaced by Titan Interface Runtime must be delegated to a governed capability or Titan Interaction Engine execution path. Risk, assurance, autonomy and approval decisions are consumed from authoritative governance services and are never calculated locally by the UI runtime.

## Pass 15 trust lifecycle

Interface Runtime now consumes source-owned governance state through `GovernanceStateProviderContract`. It presents proposal, risk, assurance, autonomy, approval, execution, receipt and rollback/recovery as separate layers. Cross-tenant/user provider results are excluded. Approval and rollback controls are handoffs (`executable=false`) to the authoritative source; the current TitanAI compatibility adapter uses TitanAI's own protected POST approval and receipt-rollback routes. Interface Runtime does not read TitanAI receipt tables, calculate governance, or proxy business mutations.
