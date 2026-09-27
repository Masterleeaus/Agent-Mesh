# CRM Integration

CRM 1.2 is the authoritative business-data provider for Titan Builder v0.8. Builder integrates through contracts and read-model descriptors; it does not import CRM Eloquent models.

`CrmBuilderDataSourceProvider` exposes only registry-backed, read-only definitions. Every CRM source declares an ID, `provider: crm`, a stable `crm.*` contract, fields, a required capability and surface compatibility. Representative contracts include customer work orders/bookings/quotes/invoices, field assigned work/tasks/minimum customer and site context, owner operations/schedule/approvals/finance, and business services/hours/locations.

`CrmBusinessConfigurationGateway` is the host bridge for authoritative company vertical configuration, available capabilities, configured services and feature flags. `CrmVerticalContextProvider` translates that contract into Builder presentation context. If CRM is not installed or the bridge is not bound, the null provider exposes no invented business capabilities.

Builder action intents such as `crm.work_order.assign` are descriptive only. Execution occurs through the platform capability/interaction layer and CRM re-authorizes the operation.
