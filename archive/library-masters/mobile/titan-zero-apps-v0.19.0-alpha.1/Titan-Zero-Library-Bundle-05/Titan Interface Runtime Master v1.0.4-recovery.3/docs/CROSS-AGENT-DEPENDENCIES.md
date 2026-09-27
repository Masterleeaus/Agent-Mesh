# Cross-Agent Dependencies

- Agent 1/Core: canonical AppSurface/AppContext and compatibility aliases. This reconstruction has an internal resolver only as a fail-safe; integration should bind Core when available.
- Agent 2/Interaction Engine: PresentationIntent/InteractionContext producer and governed capability dispatch.
- Agent 4/Builder: authoritative component catalogue.
- Agent 4/Visual Runtime: advanced visual execution through VisualRuntimeBridge.
