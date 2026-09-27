# Application Provisioning

Provisioning is configuration-driven. Titan Builder creates company-scoped application definitions consumed by the existing Titan Mobile runtimes; it does not fork Hub/Go/Command/Onboarding source code.

The `ApplicationProvisioningGateway` supports reading/creating applications; configuring identity, shared or surface brand, navigation, features, pages, theme, assistant presentation, privacy, notifications and offline policy; applying a vertical pack; previewing; validating; checking readiness; publishing; rollback/activation; four-app provisioning; and onboarding handoff.

Each surface uses a deterministic project slug (`titan-application-<surface>`), making repeated provisioning idempotent inside one company. A default page/spec is seeded from the registered surface template when the project is first created. All calls receive the trusted company ID from `CompanyContext`; callers cannot choose a tenant boundary.

Application metadata contains no CRM operational records or credentials. Production changes flow through Builder draft/version/publish/snapshot mechanics.
