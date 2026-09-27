# Payload Performance Pass 04 — Safe Lazy Loading

Pass 04 adds a reusable, authority-neutral lazy-loading boundary for non-startup diagnostics, workforce and marketplace surfaces. It does not modify the manifest, side panel, modules page, startup bootstrap, donor compatibility bundles, or existing UI routing.

The loader only activates a registered surface after an explicit caller request. Concurrent requests share one in-flight promise; successful loads are cached; failed loads are retryable. Workforce and marketplace surfaces require canonical `company_id`, legacy tenant authority aliases fail closed, and loading never grants execution or business authority.

Registered candidates are the diagnostics bootstrap profiler, workforce graph runtime, and marketplace catalog. They are deliberately not wired into shared hotspots in this pass. Existing callers can adopt the loader incrementally in later convergence work without changing visual behavior.

Phase-2 Monica/Retriever retirement remains blocked until `TZ-FIX-RUNTIME-ADAPTERS-001` is Manager-converged. Pass 04 preserves all Pass-2 deletion semantics and makes no additional donor deletions.
