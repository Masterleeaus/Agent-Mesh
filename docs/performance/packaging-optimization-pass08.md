# Payload Performance Pass 8 — Packaging Optimization Audit

Pass 8 evaluates minification, ZIP compression and tree-shaking against Manager Merge 42 plus the cumulative Builder 2 payload-performance lineage.

## Decisions

- Prefer deterministic ZIP DEFLATE level 9 at Manager packaging time. A full reconstructed-tree trial reduced 38,564,418 bytes at level 6 to 38,471,117 bytes at level 9: 93,301 bytes (~0.242%) without changing source bytes.
- Retire `pytest.out` and `node-tests.out`. They are generated command outputs, not runtime/provenance authorities, and no live textual references target them. Their level-9 package saving is 5,556 bytes.
- Do not minify/rebundle protected Titan compatibility bundles, Retriever, or `content.css`. They are already compiled/minified and active/protected boundaries.
- Do not tree-shake Retriever or other protected donor compatibility code until `TZ-FIX-RUNTIME-ADAPTERS-001` is Manager-merged and a fresh reachability/equivalence scan passes.
- Keep the ~49 KB Titan performance source layer readable. Minifying it has negligible package value and harms auditability.
- Keep Python `__pycache__/*.pyc` in this pass because historical provenance manifests still name them. They are a future provenance-cleanup candidate, not a safe Pass 8 deletion.

No business/execution authority, company boundary, manifest, UI, storage or permission behavior changes in this pass.

## Manager Phase 3 incorporated

Directive `TZ-MGR-DONOR-SLIM-M42-003` was incorporated before publish. The cumulative reconstructed tree at DEFLATE level 9 is 36,510,877 bytes, a 48.94% reduction from Merge 42. Phase 3 retires the authorized dead static assets, `monica-locales/**`, `mesh/**`, `donor-provenance/**`, `.pytest_cache/**`, `tests/__pycache__/**`, and generated test output files. `titan-zero-locales/**` remains the sole canonical 55-pack locale tree.
