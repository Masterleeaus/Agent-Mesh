# Payload Performance Pass 6 — Donor Surface Activation

Pass 6 codifies retained donor-compatible page runtimes as explicit-demand surfaces. Chat tab, options, and popup compatibility runtimes are classified as page-open activation only; unopened surfaces do not invoke the activation loader. Concurrent requests are deduplicated and activation remains authority-neutral.

The Retriever background runtime is deliberately **not** deferred or removed here. The live Monica compatibility background boundary still imports `titan-zero-chat-background.compat.js` and `retriever-background.iife.js`, so Retriever remains startup-bound until `TZ-FIX-RUNTIME-ADAPTERS-001` is Manager-converged and a fresh reachability/equivalence scan authorizes retirement.

No manifest, side-panel, modules page, compiled compatibility bundle, background boundary, or Retriever production bytes are modified by this pass. Manager-authorized Pass 2/5 retirements remain cumulative.
