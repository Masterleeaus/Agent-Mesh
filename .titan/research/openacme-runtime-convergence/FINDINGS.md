# Findings

1. Titan's authority runtime is materially stronger than OpenAcme's direct agent-to-tool model for consequential business actions. Preserve Titan's boundary.
2. OpenAcme's strongest donor pattern is not its database or UI; it is the long-lived conceptual agent turn: persisted conversation + autonomous wake + multi-step tool use + streamed progress.
3. OpenAcme's `agent-core` is tightly integrated with its DB, task and memory stores. Copying it wholesale would violate the seven-agent ownership split and SQLite convergence.
4. Titan benefits from a narrow coordinator whose dependencies are ports/contracts. This permits local models, cloud providers and future Model Council routing without reducing model selection to a provider/model string.
5. Runtime persistence must record waiting states, not merely messages. A waiting business operation is first-class durable state.
6. Tool discovery and tool authority are separate. Runtime resolves availability first, then obtains an authority decision, then executes through the governed gateway.
7. Structured operational status is sufficient for live UX; chain-of-thought is neither required nor exposed.
