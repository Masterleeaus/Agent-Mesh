# TitanAI Integration

Titan Builder does not embed an AI provider stack. `AiUiGenerator` remains the Builder contract. When the host binds `TitanAiRuntimeGateway`, the service provider resolves `TitanAIAiUiGenerator`; otherwise it resolves `UnavailableAiUiGenerator` and fails closed.

The TitanAI adapter sends only structured Builder context: company/project identity, surface, vertical, application type, registered components/blocks/templates/themes, currently available data sources/actions, brand tokens, device/network target, current Builder spec and the user's request. Unknown context keys and secrets are not forwarded.

TitanAI returns a proposed declarative Builder spec only. The proposal is normalised and validated before it can reach preview or persistence. Unknown components, actions or data sources, raw executable HTML/script, and attempts to change `company_id` are rejected. AI proposals never publish automatically.
