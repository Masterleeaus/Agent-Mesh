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
