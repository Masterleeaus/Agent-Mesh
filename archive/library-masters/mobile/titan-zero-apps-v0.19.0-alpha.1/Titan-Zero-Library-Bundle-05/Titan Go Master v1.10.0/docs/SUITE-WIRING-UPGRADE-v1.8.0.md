# Titan Go v1.8.0 — Core PWA / Device Shell Upgrade

- Go now consumes Titan Apps Core `AppPwaLifecycle` directly instead of merely declaring offline capability.
- Core remains authoritative for shared service-worker and device/offline lifecycle ownership.
- Go adds a small app-specific browser shell runtime for connectivity/readiness presentation only.
- The browser shell stores only non-sensitive shell metadata; it never persists provider records, permissions, credentials, or company authority.
- `company_id` remains the sole tenant/company boundary.
- Titan Field remains field/business truth and governed replay authority.
- Interaction Engine remains interaction/presentation-intent authority; Interface Runtime remains semantic execution authority; Visual Runtime remains downstream presentation execution.
