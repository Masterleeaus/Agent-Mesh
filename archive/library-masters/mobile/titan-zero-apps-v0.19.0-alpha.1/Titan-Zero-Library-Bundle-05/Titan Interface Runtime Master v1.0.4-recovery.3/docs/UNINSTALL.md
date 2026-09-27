# Uninstall — Titan Interface Runtime v1.0

Titan Interface Runtime owns no authoritative CRM, Work, Finance, Connect, Maps, announcement, survey, wizard, journey or customer/business records. Uninstall **must never delete authoritative business data**.

The extension uninstall hook performs only package-owned cleanup:

1. remove the `titan_interface_runtime` host menu projection when the legacy menu fallback was used;
2. ask the host Menu service to regenerate its cache when available;
3. delete the optional published `config/titan-interface-runtime.php` file.

It must not delete donor-extension tables, Interaction Engine sessions, TitanAI receipts/approvals, Workspace Projects, Maps data or any domain-extension records. `extension.manifest.json` therefore declares no migrations, no owned tables and `default_uninstall_policy=retain`.

## Donor packages

Uninstalling Interface Runtime does not uninstall Menu, Focus Mode, Announcement, Onboarding Pro or Introductions. Donor retirement is a separate operator decision described in `docs/MIGRATION-GUIDE-v1.md`. Re-enable any donor presentation package needed for rollback before removing Interface Runtime.
