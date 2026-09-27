# Cross-Agent Dependencies — Agent 3 / Titan Hub

- Agent 1 / Core: Hub expects canonical `hub` AppSurface/AppContext discovery when Core becomes available. Current reconstruction remains independently bootable and preserves `customer -> hub` compatibility metadata.
- Agent 2 / Interaction Engine: Hub exposes interaction through a public-contract adapter. Existing v10.5.3 still contains legacy `command/onboarding` canonicalization; Agent 2 owns that migration.
- Agent 3 / Interface Runtime: Hub emits semantic interface payloads and will bind the public runtime contract when present. No runtime implementation is copied into Hub.
- Agent 4 / Builder + Visual Runtime: Hub consumes governed catalogue/visual behavior through public runtime contracts when available. No Builder/Visual implementation is copied into Hub.
- CRM: current CRM already compiles against Hub `CustomerOperationsGateway`; this exact interface is intentionally preserved.


## Full-suite production convergence (alpha.7)
- Core: Hub consumes `TitanAppsApplicationRegistry` / canonical `AppSurface::Hub` for readiness only; no Core implementation was modified.
- Interaction Engine: native manifest dependency key is `interaction-engine`; compatibility `extension.json` retains `titan-interaction-engine`. Hub consumes `PublicInteractionEngineInterface` and `CapabilityIntentGatewayInterface`.
- Interface Runtime: Hub executes semantic specs through `InterfaceRuntime::execute()` and `InterfaceContext`; no runtime implementation was modified.
- Builder: Hub semantic specs use component IDs verified against the current Builder catalogue. Builder remains component-definition authority.
- Visual Runtime: Hub supplies visual metadata only; execution remains Interface Runtime -> Visual Runtime.
- Integration evidence: `integration/EIGHT-SUITE-INTEGRATION.json` and verifier Hub version were updated for alpha.7; no other extension implementation files were changed.
