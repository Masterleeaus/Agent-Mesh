# Titan Web

Titan Web is the DirectAdmin-facing Brand Studio package boundary. The role
entrypoints render the shared authenticated DirectAdmin session and a
company-scoped, read-only Brand Studio projection. They do not yet implement
website provisioning, editing, preview, publish, update, restore, rollback,
portal sessions, or CMS administration. Do not use this package as evidence
that those issue requirements are complete.

The future cockpit must use the canonical Titan DirectAdmin session and
company-scoped projections. DirectAdmin role is presentation context only.
All writes must be implemented by the canonical governed action owner and must
retain receipts/evidence; provider acknowledgement alone is not completion.

Assemble and install on a supported DirectAdmin host only through its Plugin
Manager after reviewing the archive and SHA-256 sidecar. The install/update
checks are non-mutating. Uninstall preserves all customer and business data.
Live-host installation and publication have not been certified by this
package.

## Reproducible package

Compile the canonical Titan DirectAdmin browser SDK as a self-contained ESM
module, then provide it to the package builder. Do not use a fixture SDK for a
release artifact:

```sh
node apps/directadmin/brand-studio/tools/package.mjs \
  --sdk-module /path/to/canonical-sdk.mjs \
  --output-dir /tmp/titan-web-dist
```

The builder requires the browser session, projection mount and shared package
validators, applies an explicit file allowlist and executable modes, validates
the deterministic archive contents, and emits `titan_web.tar.gz` with a
SHA-256 sidecar. The archive contains the compiled SDK consumed by the role
entrypoints; the source tree intentionally does not ship a placeholder SDK.

