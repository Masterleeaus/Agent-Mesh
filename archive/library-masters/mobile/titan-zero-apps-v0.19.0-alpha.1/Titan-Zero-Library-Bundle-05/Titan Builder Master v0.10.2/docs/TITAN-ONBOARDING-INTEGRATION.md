# Titan Onboarding Integration

Titan Onboarding is a separate PWA and a major consumer of Titan Builder's provisioning gateway. Builder does not own onboarding wizard progression. Interaction Engine owns wizard state, validation, approvals and branching; TitanAI supplies understanding/reasoning; CRM owns the resulting business configuration.

The `onboarding` surface starts with a neutral Titan shell and can be branded after company identity is collected. Its template is conversation-first and includes presentation for voice input, generated controls, progress, review, integration connection, brand/app previews, readiness and final handoff.

`ApplicationProvisioningGateway` allows a governed actor to create/configure the four application definitions without knowing Builder tables. `provisionApplicationSet()` idempotently creates the four surface projects and applies shared brand/vertical/surface configuration. `handoff()` returns readiness, version/snapshot references and mobile open/install capabilities without sending invitations or device identities.
