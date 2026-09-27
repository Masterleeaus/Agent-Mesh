# Titan Builder v0.8 Architecture

Titan Builder owns versioned application presentation configuration. CRM owns business state; TitanAI proposes Builder specs; Interaction Engine owns wizard state and branching; Titan Mobile runs the four PWAs; Titan Connect owns communication transport; Chatbot Builder owns Chatbot configuration.

The canonical tenant boundary is `company_id`. Builder does not accept route/query/form company identifiers as authority. The trusted request attribute and authenticated user's `company_id` must agree when both are present, otherwise access fails closed.

Builder persists projects, pages, page specs, themes, templates, assets, versions, AI-generation audit jobs and immutable publish snapshots. PWA provisioning reuses this existing persistence model: one project per company/surface with application metadata in the project and page specs in the normal page/spec tables. No separate per-customer Laravel runtime or parallel PWA database is created.

Four surfaces are registered: `customer` (Titan Hub), `field` (Titan Go), `owner` (Titan Command), and `onboarding` (Titan Onboarding). Existing surface IDs remain stable for v0.7 compatibility.

All operational actions remain intents. Builder never mutates CRM records directly. Published definitions are schema-constrained JSON DTOs for Titan Mobile.
