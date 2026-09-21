# Browser AI subsystem staging import

This directory preserves donor implementation code extracted from `Extensions(1).zip` before any Titan Code merge.

## Rules

- Donor files are preserved as staging evidence; do not execute them directly from the extension.
- Integrate behavior through existing Titan Code provider, browser, governance, capability and approved-network-transport boundaries.
- Do not copy donor `fetch`, `WebSocket`, `eval`, DOM sink, OAuth storage or permission behavior into `src/` without adapting it to Titan Code safety contracts.
- ChatGPT subscription/Codex transport is staged separately from OpenAI API-key transport.
- Local inference must remain provider-agnostic: Chrome Prompt API, WebGPU/WebLLM, Ollama/LM Studio/llama.cpp/vLLM/OpenAI-compatible local endpoints.
- Original donor archive identity and every staged file SHA-256 are recorded in `provenance/IMPORT-MANIFEST.json`.

## Imported subsystem folders

- `auto-browser/` — CDP, WebMCP, perception, recovery, action journal, tab isolation, local providers.
- `do-browser-chatgpt-codex/` — OAuth/PKCE and Codex-style ChatGPT subscription transport plus agent/tool runtime bundles.
- `chrome-prompt-api/` — Chrome built-in local Prompt API donor.
- `webllm-offline/` — downloaded in-browser model donor.
- `webgpu-on-device/` — WebGPU/WASM control-plane code; binary WASM/model payloads intentionally remain in the original donor archive.
- `browseragent-local-runtime/` — local browser agent runtime glue.
