# Browser Local AI Provider — Pass 06

Titan Code exposes its existing browser-model runtime as the governed `browser-local-model` inference provider. This is a convergence adapter, not a second inference engine.

Execution remains inside the existing BrowserModelRuntimeAdapter and therefore reuses the scheduler, WebGPU resource router, offscreen execution boundary, streaming/runtime infrastructure, diagnostics, output verification, working memory, and WASM/CPU fallback paths. The provider is classified `ON_DEVICE` / `DEVICE_OWNED`, is advisory-only, and cannot grant execution, mutation, verification, approval, browser-permission, or canonical authority.

The staged WebLLM/WebGPU donor code remains provenance/reference material under `imports/`; it is not executed directly. Titan Code remains private development infrastructure and is not a Titan Zero production dependency.
