# TZ-NEXT-015 Pass 6 — Payments, communications, BYO providers and notifications

Pass 6 adds one company-scoped onboarding configuration projection over existing Titan authorities. It does not create a second payments, channel, provider or notification runtime.

- Payments reference the existing `crm.invoice.create` and `finance.payment.reconcile` capabilities and store accepted-method preferences only.
- Communications must resolve to existing `channel.*` entries in `titan-capabilities/native-contributions.json`; selecting a channel does not permit sending.
- BYO provider metadata is projected through `ai-provider-control-centre.mjs`. Credential material remains in existing provider storage and is never copied into onboarding.
- Notification defaults are contracted through `notification-escalation-settings.mjs`; dispatch and escalation remain governed runtime transitions.
- `company_id` is the only company boundary. No identity, selected provider/channel, payment method or notification setting grants authority.
