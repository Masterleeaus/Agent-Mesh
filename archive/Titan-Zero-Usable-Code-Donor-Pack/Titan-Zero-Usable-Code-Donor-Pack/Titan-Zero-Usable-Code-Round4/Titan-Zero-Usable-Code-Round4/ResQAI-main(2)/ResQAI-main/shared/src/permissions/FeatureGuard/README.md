# FeatureGuard

Conditionally renders children based on feature flag status.

## Props

- `feature` — feature flag key to check
- `enabledFeatures` — list of currently enabled feature flags
- `fallback` — content to render when feature is disabled (default `null`)
