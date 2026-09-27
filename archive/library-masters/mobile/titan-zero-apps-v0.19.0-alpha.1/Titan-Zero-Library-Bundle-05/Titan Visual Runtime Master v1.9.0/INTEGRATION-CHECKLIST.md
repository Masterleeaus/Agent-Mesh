# Titan Apps: Visual Runtime Integration Checklist

- [ ] Install as `titan-visual-runtime` and expose public contracts through DI.
- [ ] Keep zero/go/hub as the only canonical application surfaces.
- [ ] Verify Builder visual metadata contract version and schema fingerprint.
- [ ] Preserve `company_id`-scoped visual contribution isolation and deterministic snapshots; legacy tenant identifiers are compatibility inputs only.
- [ ] Keep all visual contributions declarative; never authorize actions or alter business meaning.
- [ ] Preserve reduced-motion, high-contrast, low-power, poor-GPU and offline fallbacks.
- [ ] Verify SHA-256 for offline-cached resources when bytes are available.
- [ ] Run host Interface Runtime integration tests before production release.
