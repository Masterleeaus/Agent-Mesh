# FieldFlow Data Model

## Entity Relationship Diagram

```mermaid
erDiagram
    EQUIPMENT ||--o{ SERVICE_CASE : has
    EQUIPMENT ||--o{ AUTOMATION_EVENT : generates
    EQUIPMENT ||--o{ AGENT_INTERACTION : referenced_by
    SERVICE_CASE o|--o{ AUTOMATION_EVENT : created_by
    SERVICE_CASE o|--o{ AGENT_INTERACTION : requested_by

    EQUIPMENT {
        string equipment_id PK
        string model
        string category
        string serial_number UK
        string location
        string assigned_dealer
        string status
        float engine_hours
        float fuel_level
        int health_score
        date last_service_date
    }

    SERVICE_CASE {
        int case_id PK
        string equipment_id FK
        string title
        text description
        string priority
        string status
        string source
        string assigned_to
        datetime created_at
        datetime updated_at
    }

    AUTOMATION_EVENT {
        int event_id PK
        string equipment_id FK
        string event_type
        string outcome
        text details
        int service_case_id FK
        datetime created_at
    }

    AGENT_INTERACTION {
        int interaction_id PK
        string equipment_id FK
        text user_message
        string detected_intent
        float confidence
        text agent_response
        string action_status
        int service_case_id FK
        datetime created_at
    }
```

## Design Decisions

- Equipment IDs are stable business identifiers.
- Serial numbers are unique to prevent duplicate assets.
- Service cases maintain foreign-key relationships to equipment.
- Automation events preserve every workflow decision.
- Agent interactions store intent, confidence, response, and action status.
- Agent and automation records can optionally reference created cases.
- Status and priority indexes support common service-queue queries.
- Equipment deletion cascades to related operational records.
- Case timestamps support auditability and SLA reporting.

## Dataverse Mapping

| SQLAlchemy model | Dataverse table |
|---|---|
| `EquipmentRecord` | Equipment |
| `ServiceCaseRecord` | Service Case |
| `AutomationEventRecord` | Automation Event |
| `AgentInteractionRecord` | Agent Interaction |

Dataverse lookup columns would replace the SQL foreign keys while preserving
the same one-to-many relationships.