# Chatbot Forward Import — Titan-Interaction-Engine

This package is the v0.99.1 Titan-Interaction-Engine base plus forward-use code extracted from the Pass11 Chatbot runtime.

- Existing v0.99.1 files were preserved.
- Non-colliding source was added at its intended extension-relative path.
- Colliding older Chatbot files were not allowed to overwrite current platform code; they are under `collision-candidates/`.
- This is a merge/staging delta, not a claim that every imported class is already namespace-adapted or registered in the current service provider.
- Embedded Chatbot workforce/governance/model-routing authority was intentionally excluded.
