# Titan Apps Interaction Engine 10.6.0

This convergence release moves **development ownership** of the Interaction Engine into the Titan Apps Suite while preserving its platform-facing public contract role. The runtime remains usable by provider/domain extensions through public contracts and capability registries.

Canonical surfaces are now `zero`, `go`, and `hub`. Historical `command`, `bos`, `owner`, `manager`, and onboarding-surface identifiers resolve to `zero`; `onboarding` is a journey on Zero.

The release adds explicit `InteractionContext`, `PresentationIntent`, public-runtime, and AI-provider registry contracts. Browser/device/BYO/cloud intelligence is guidance/orchestration only and cannot become business execution authority.
