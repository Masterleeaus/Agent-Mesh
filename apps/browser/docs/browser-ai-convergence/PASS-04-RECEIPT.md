# Pass 04 Receipt — Generic Local OpenAI-Compatible Provider

Status: COMPLETE

## Implemented
- Added `CodeeOpenAICompatibleLocalAdapter` behind the existing `CodeeProviderGateway`/`CodeeAIProviderRegistry` authority.
- Presets: Ollama Direct, LM Studio, llama.cpp, vLLM, custom OpenAI-compatible endpoint.
- Supports `/v1/models`, `/v1/chat/completions`, optional `/v1/embeddings`, model discovery/selection, local zero-cost metadata and customer-hosted locality metadata.
- Uses only `CodeeApprovedNetworkTransport`; Chrome origin permission remains explicit and credentials are omitted from URLs and public metadata.
- Retained the existing Ollama-via-Titan-Bridge adapter unchanged for compatibility.
- Loaded the new adapter into the service worker without auto-enabling an endpoint. Configuration remains explicit/fail-closed.

## Authority / architecture
- `CodeeProviderGateway` remains the sole inference execution authority.
- Local endpoints do not gain plan, repository, browser-permission, mutation, verification or canonical authority.
- Titan Code remains a private development/management tool; this adapter is not a Titan Zero production runtime dependency.
- `company_id` remains the only Titan tenant boundary.

## Verification
- `test-openai-compatible-local-provider-pass04.js`: PASS
- `test-gemini-ollama-provider-wiring.js`: PASS
- `test-ai-provider-gateway-authority-pass1.js`: PASS
- Source manifest regenerated after changes.
