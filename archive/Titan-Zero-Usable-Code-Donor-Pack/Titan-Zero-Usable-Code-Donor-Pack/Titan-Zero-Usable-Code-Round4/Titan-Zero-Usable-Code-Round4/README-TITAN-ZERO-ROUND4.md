# Titan Zero usable-code donor pack — Round 4

## Deep-scan findings

### ai-fsm
Highest-value donor and effectively a broad FSM application foundation. Contains TypeScript domain packages, worker automations, job/visit/estimate/payroll/mileage/vehicle/pricing/communications logic, tests and application surfaces. Preserve functionality while converging naming/contracts into Titan Zero rather than treating it as a sidecar.

### ResQAI
Large modular TypeScript application with reusable SDK/runtime/config/UI packages and multiple V2 applications including customer portal, support, analytics, resolution, CRM and admin centers. Strong donor for Titan Hub/Command modular surfaces and shared component/runtime patterns.

### fieldops-ai
Strong Command/operations donor: control tower, capacity planning, repair orders, shop board, simulation/benchmarking, technician command/diagnostic copilot, service recovery, performance center, dispatch optimizer, assistant, API stores and tests. Also contains a source-level landing/marketing surface.

### FieldServicePro
Broad Python FSM donor with models/migrations/seeds for clients, jobs, projects, quotes, contracts, warranties, parts, equipment, purchase orders, vendors, payroll/vehicles, recurring work, compliance, documents, change orders, lien waivers and project management. Use primarily as domain/workflow reference when Titan already has TypeScript equivalents; do not introduce Python as a parallel core runtime unnecessarily.

### fieldflow-ai
FastAPI + React/Vite donor with service cases, agent intent/service, automations, telemetry and equipment data. Useful for capability patterns and test cases; port useful concepts to Titan's TypeScript architecture rather than adding a second backend.

### fieldcrewai
A real compiled/static marketing site with blog/layout assets plus serverless lead-magnet and contact functions. Useful as a marketing-site donor, but source provenance/build source should be checked before deep modification.

## Marketing-site findings
- fieldcrewai: complete compiled/static public marketing site + blog + lead/contact functions.
- fieldops-ai: editable source-level landing page and landing styles/components.
- Other repositories are primarily product/application code rather than dedicated marketing sites.

## Integration rules
- Canonical tenant boundary is `company_id`; normalize legacy org/tenant fields before auth/data/storage/execution.
- Keep Titan Zero's canonical surfaces: Zero/Command, Go and Hub.
- Preserve useful FSM behavior from ai-fsm while rebranding/converging it into Titan Zero.
- Prefer TypeScript ports of useful Python behavior rather than establishing a parallel Python architecture.
- Provider-specific services become adapters.
- Review license/provenance before production redistribution.
- Secrets, env files, dependency/build directories and lockfiles are excluded.
