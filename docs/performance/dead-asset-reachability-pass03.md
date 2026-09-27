# Payload Performance Pass 03 — duplicate/dead asset reachability proof

Baseline: Manager Merge42 (`1c4b6f471ba16f44d7b27db546ba41db18032ce9967b1d725dc0926cd73cc930`).

Pass02 already retired the four Manager-authorized Phase-1 payloads: `monica-content.js`, `monica-content.css`, `monica-background.js`, and the nested lineage evidence ZIP. Pass03 does not widen that deletion set.

The remaining large duplicate opportunities are not dead yet. `content.css` is byte-identical to `titan-zero-chat-content.compat.css`, but current HTML/runtime routes still reference the donor CSS. `monica-popup.css` is byte-identical to `titan-zero-chat-runtime.compat.css`, but `monicaPopup.html` still references the donor popup CSS. `content.js`, `content.css`, `monica-popup.js`, `monica-popup.css`, and `retriever-background.iife.js` all have current route/runtime references. Retriever remains directly imported by `compatibility/monica/background-runtime-boundary.mjs`.

Several Monica guide/static assets are reachable from the still-retained `content.js` donor bundle. They are therefore deferred with that bundle rather than individually deleted.

Runtime Adapters (`TZ-FIX-RUNTIME-ADAPTERS-001`) is still active with Pass06 next and has not been Manager-converged. The Manager destructive Phase-2 gate remains closed. Pass03 consequently publishes reachability evidence and **zero new deletion proposals**.

Security invariants remain unchanged: `company_id` is the sole company boundary; identity/permission do not confer execution authority; no UI or manifest rewrite is performed.
