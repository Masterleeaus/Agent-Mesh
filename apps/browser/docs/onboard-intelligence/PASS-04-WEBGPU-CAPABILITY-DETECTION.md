# Pass 04 — WebGPU Capability Detection

Implemented a browser-local compute probe for Codee's shared intelligence host. The detector inspects WebGPU API availability, adapter/device creation, selected adapter/device limits, features, browser memory hints and produces a bounded compute profile for later model selection.

## Compute profiles

- `high` — larger quantized browser models and longer contexts may be considered.
- `balanced` — medium local models with conservative context limits.
- `constrained` — small quantized models; GPU embeddings are avoided by default.
- `fallback` — WebGPU unavailable or unusable; later passes must route to WASM/CPU or optional external providers.

## Invariants

- Capability detection is separate from Browser Control permissions and does not grant page automation authority.
- Probe output contains bounded capability metadata only; no model execution or plan advancement occurs here.
- The detector caches short-lived probe results to avoid repeatedly allocating GPU devices.
- Temporary probe devices are destroyed after limits/features are captured when supported.
- Model recommendations are advisory and reject candidates exceeding the selected profile's model-size or context guidance.
- Multi-conversation inference remains serialized by the Pass 3 shared host; this pass does not add per-tab model instances.
