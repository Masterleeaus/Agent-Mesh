# Pass 9 Performance & Donor Regression

This pass compares the typed runtime adapter layer with the frozen Merge39 Retriever/Monica compatibility evidence. It does not delete or rewire donor runtime files.

The benchmark measures pure JavaScript hot-path cost for adapter negotiation, typed submission preparation, Retriever compatibility mapping, and lifecycle creation over 10,000 iterations. This is not a browser/network benchmark; it isolates adapter overhead from provider latency and DOM/runtime costs.

The capability matrix records whether each known donor behavior is preserved, hardened, added, or deliberately retained as fallback. `retriever-background.iife.js` remains guarded and is not declared safe to retire by Builder 3; Manager convergence plus a fresh reachability/equivalence scan is still required.
