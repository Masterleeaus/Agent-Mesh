# FieldFlow AI Power Platform Blueprint

This directory documents how FieldFlow AI can be implemented using
Microsoft Power Platform.

The working project currently uses a React dashboard, FastAPI services,
SQLAlchemy, and SQLite. These artifacts define the corresponding
Dataverse, Power Automate, custom connector, and Copilot Studio
architecture.

## Implementation Status

The software demonstrated in the repository is fully functional locally.

The Power Platform artifacts are implementation-ready design documents.
They have not been deployed because the available Microsoft 365 tenant
does not permit non-administrators to create Developer environments.

This limitation is documented to distinguish implemented functionality
from proposed enterprise deployment architecture.

## Component Mapping

| Current implementation | Power Platform implementation |
|---|---|
| SQLite equipment records | Dataverse Equipment table |
| SQLite service cases | Dataverse Service Case table |
| Automation service | Power Automate cloud flow |
| FastAPI REST endpoints | Power Platform custom connector |
| React operations dashboard | Canvas app or model-driven app |
| Service Agent panel | Copilot Studio agent |
| Agent interaction records | Dataverse Agent Interaction table |
| Automation event records | Dataverse Automation Event table |
| Local documentation | SharePoint knowledge library |
| Local user interface | Microsoft Teams or Power Apps |

## Proposed Solution Components

The proposed Power Platform solution would contain:

- One Dataverse-backed internal operations application
- Four primary Dataverse tables
- One custom connector for the FieldFlow REST API
- One critical-condition routing flow
- One SLA escalation flow
- One equipment synchronization flow
- One Copilot Studio service agent
- Environment variables for API URL and notification recipients
- Role-based security definitions
- Connection references for Dataverse, Teams, Outlook, and SharePoint

## Dataverse Tables

The proposed schema includes:

1. Equipment
2. Service Cases
3. Automation Events
4. Agent Interactions

The complete column and relationship design is documented in
[`dataverse-schema.md`](./dataverse-schema.md).

## Custom Connector

The FieldFlow custom connector exposes selected FastAPI operations to
Power Apps, Power Automate, and Copilot Studio.

Planned connector actions include:

- Get all equipment
- Retrieve an equipment record
- Retrieve live telemetry
- List service cases
- Create a service case
- Evaluate equipment automation
- Send a request to the Service Agent

A deployed connector would require:

- A publicly reachable HTTPS API
- The deployed API hostname in the connector definition
- Authentication appropriate for the organization
- Data-loss-prevention policy classification
- Separate development, test, and production connection references

For production use, Microsoft Entra ID authentication would replace the
unauthenticated local development configuration.

## Power Automate

The primary workflow evaluates telemetry for critical conditions.

When a critical condition is detected, the flow:

1. Searches Dataverse for an active automated case.
2. Prevents creation when a matching case already exists.
3. Creates a service case when no duplicate exists.
4. Assigns the responsible dealer or service group.
5. sends a Teams or Outlook notification.
6. Records an Automation Event for auditing.

The detailed flow design appears in
[`flows/critical-case-routing.md`](./flows/critical-case-routing.md).

## Copilot Studio

The proposed Copilot Studio agent would use the FieldFlow custom
connector as a collection of controlled tools.

Supported conversations would include:

- Asking for an equipment health summary
- Retrieving live telemetry
- Identifying machines that need attention
- Recommending troubleshooting actions
- Requesting creation of a service case
- Confirming a service-case action before execution

Service-case creation requires explicit human confirmation. Agent
requests, confidence values, selected equipment, sources, and action
outcomes are stored for auditing.

The working local Service Agent demonstrates this behavior through the
FastAPI agent endpoint and React user interface.

## SharePoint and Microsoft 365

A production implementation would store approved service manuals and
support procedures in a SharePoint document library.

The agent would be restricted to approved knowledge sources. Power
Automate would use Microsoft Teams or Outlook for service notifications
and escalation messages.

## Security Principles

- Least-privilege Dataverse security roles
- Separate maker and end-user permissions
- Human confirmation before write actions
- Auditable agent and automation activity
- No autonomous destructive actions
- Environment variables instead of hard-coded production values
- Authenticated HTTPS access to external APIs
- Development, test, and production solution separation
- Data-loss-prevention policies for connectors

## Proposed Security Roles

| Role | Access |
|---|---|
| Operations Viewer | Read equipment, telemetry, and service cases |
| Service Coordinator | Create and update service cases |
| Technician | Read assigned equipment and update assigned cases |
| Automation Service | Read equipment and manage automation events |
| Platform Administrator | Configure tables, flows, connections, and roles |

## Deployment Sequence

1. Create a managed Power Platform solution.
2. Define environment variables and connection references.
3. Create the Dataverse tables and relationships.
4. Import the FieldFlow custom connector.
5. Configure authentication and API hostname.
6. Create the Power Automate workflows.
7. Build the internal Power App.
8. Configure the Copilot Studio agent and its tools.
9. Apply security roles and data-loss-prevention policies.
10. Execute acceptance tests in a test environment.
11. Export a managed solution for production deployment.

## Repository Evidence

The repository provides working evidence for the proposed design:

- REST API and interactive OpenAPI documentation
- Relational SQLAlchemy database models
- Live equipment telemetry
- Automated service-case routing
- Duplicate-case prevention
- Human-confirmed AI agent actions
- Agent and automation audit records
- Automated API tests
- Continuous integration
- Architecture, governance, testing, and support documentation