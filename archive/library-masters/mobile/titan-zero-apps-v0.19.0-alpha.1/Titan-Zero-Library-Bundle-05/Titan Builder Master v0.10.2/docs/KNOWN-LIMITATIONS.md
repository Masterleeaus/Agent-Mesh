# Known Limitations

- Real MagicAI/Titan host certification is not possible from the standalone extension archive alone. Provider discovery, middleware, CSRF, actual migrations and `php artisan test` require the host installation.
- CRM 1.2 and TitanAI are integrated through contracts; their concrete host adapters must be supplied by those extensions/platform integration code.
- Capability availability falls back to configured capabilities and is intentionally fail-closed when no machine-readable router is bound.
- The application handoff returns capability references for open/install/worker flows; Builder does not register devices, send worker invitations or deliver communications.
- Preview fixtures are presentation data only and do not certify a live CRM workflow.
- Ambiguous v0.7 WorkCore-era property/inventory actions require manual migration review.

## v0.9 Management UI host boundaries

- The extension ships complete company and Super Admin management pages, but automatic insertion into a specific MagicAI global sidebar has not been certified against a live host. Hosts can link the stable named routes `titan-builder.manage.dashboard` and `titan-builder.admin.dashboard`.
- Host roles must expose the Builder abilities used by the UI (`builder.read`, `builder.edit`, `builder.publish`, `builder.assets.manage`, `builder.templates.manage`, `builder.admin`). Titan Builder does not create or assign host roles.
- Blade compilation, CSRF/session behavior and asset publishing must still be verified inside the target MagicAI/Titan installation.
