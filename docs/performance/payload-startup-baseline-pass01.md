# Payload Performance Pass 01 — Merge41 Baseline

Scope: measurement only. No runtime/UI/manifest behavior is removed, deferred or rewritten in this pass.

## Canonical source

- Manager Merge: 41
- Artifact: `Titan-Zero-CANONICAL-MASTER-2026-09-08-MERGE-41-LOAD-STABILITY-CONVERGED.zip`
- SHA-256: `dfbd39a0475de73dc00bc1dee82c3969194a45db0ae8fc1fc0a92651641addd2`
- Application files: 2,989

## Package baseline

- Uncompressed payload: 185,293,390 bytes (~176.71 MiB)
- ZIP compressed payload: 70,934,950 bytes (~67.65 MiB)
- Compression ratio: ~38.28%

Largest top-level contributors by uncompressed bytes are root files (~150.09 MB), `static/` (~20.85 MB), `side-panel/` (~3.93 MB), `offscreen/` (~2.42 MB), `content/` (~1.04 MB), tests (~0.99 MB), and `titan-workforce/` (~0.77 MB).

The largest individual payloads are the retained Monica/Titan compatibility content bundles (~28.59 MB each), retained background bundles (~11.56 MB each), the lineage evidence archive (~9.03 MB), retained popup/runtime bundles (~7.78 MB each), and compatibility CSS (~2.54 MB each). These are measurements only; duplicate/dead/reachability classification belongs to later passes and nothing is proposed for deletion here.

## Startup exposure baseline

Manifest document-start JS entries total 29,701,069 uncompressed bytes (~28.33 MiB), dominated by `titan-zero-chat-content.compat.js`. Manifest content-script CSS entries total 2,543,467 bytes (~2.43 MiB).

The `background-bootstrap.js` static ESM import closure resolves to 78 packaged files totaling 15,179,156 uncompressed bytes (~14.48 MiB) and 4,435,495 compressed bytes (~4.23 MiB). This is a static dependency-closure measurement, not a claim that every module performs equal startup work.

## Timing and memory baseline

Pass 01 preserves the current Load Stability reproducible bootstrap profile from `diagnostics/startup/pass08-bootstrap-profile.json`: 15 node-mocked Chrome samples, p50 31.083 ms, p95 33.214 ms, p95 positive heap delta 206,608 bytes, maximum 12 candidate tabs, peak concurrency 4, profile `ok=true`.

Live unpacked-Chrome memory was not measured in this environment, so Pass 01 explicitly records that external gate rather than inventing a browser-memory number. Later low-resource and live-Chrome passes should compare against both this reproducible profile and real Chrome measurements when available.

## Boundaries

Measurement code is authority-neutral. It does not grant execution/business/company authority, does not treat identity as authority, and does not alter the canonical `company_id` boundary.
