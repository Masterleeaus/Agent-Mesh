# Proposed Dataverse Schema

## Purpose

This document maps the working FieldFlow relational model to a proposed
Microsoft Dataverse implementation.

The publisher prefix used in this design is `ff`.

## Equipment Table

**Display name:** Equipment  
**Logical name:** `ff_equipment`  
**Primary name column:** Equipment ID

| Display name | Logical name | Type | Required |
|---|---|---|---|
| Equipment ID | `ff_equipmentid` | Text | Yes |
| Model | `ff_model` | Text | Yes |
| Category | `ff_category` | Choice | Yes |
| Serial Number | `ff_serialnumber` | Text | Yes |
| Location | `ff_location` | Text | Yes |
| Assigned Dealer | `ff_assigneddealer` | Text | No |
| Operating Status | `ff_operatingstatus` | Choice | Yes |
| Engine Hours | `ff_enginehours` | Decimal | Yes |
| Fuel Level | `ff_fuellevel` | Decimal | Yes |
| Health Score | `ff_healthscore` | Whole number | Yes |
| Last Service Date | `ff_lastservicedate` | Date only | No |
| Last Telemetry Update | `ff_lasttelemetryupdate` | Date and time | No |

`ff_equipmentid` should be configured as an alternate key to prevent
duplicate equipment records during synchronization.

## Service Case Table

**Display name:** Service Case  
**Logical name:** `ff_servicecase`  
**Primary name column:** Case Title

| Display name | Logical name | Type | Required |
|---|---|---|---|
| Case Number | `ff_casenumber` | Autonumber | Yes |
| Case Title | `ff_casetitle` | Text | Yes |
| Equipment | `ff_equipment` | Lookup | Yes |
| Description | `ff_description` | Multiple lines | Yes |
| Priority | `ff_priority` | Choice | Yes |
| Case Status | `ff_casestatus` | Choice | Yes |
| Source | `ff_source` | Choice | Yes |
| Assigned To | `ff_assignedto` | Text or User lookup | No |
| Created On | Standard column | Date and time | Yes |
| Modified On | Standard column | Date and time | Yes |
| Resolved On | `ff_resolvedon` | Date and time | No |
| SLA Due | `ff_sladue` | Date and time | No |

## Automation Event Table

**Display name:** Automation Event  
**Logical name:** `ff_automationevent`  
**Primary name column:** Event Name

| Display name | Logical name | Type | Required |
|---|---|---|---|
| Event Name | `ff_eventname` | Text | Yes |
| Equipment | `ff_equipment` | Lookup | Yes |
| Service Case | `ff_servicecase` | Lookup | No |
| Automation Type | `ff_automationtype` | Choice | Yes |
| Outcome | `ff_outcome` | Choice | Yes |
| Details | `ff_details` | Multiple lines | Yes |
| Telemetry Snapshot | `ff_telemetrysnapshot` | Multiple lines | No |
| Created On | Standard column | Date and time | Yes |

## Agent Interaction Table

**Display name:** Agent Interaction  
**Logical name:** `ff_agentinteraction`  
**Primary name column:** Interaction Name

| Display name | Logical name | Type | Required |
|---|---|---|---|
| Interaction Name | `ff_interactionname` | Text | Yes |
| User Message | `ff_usermessage` | Multiple lines | Yes |
| Agent Reply | `ff_agentreply` | Multiple lines | Yes |
| Detected Intent | `ff_detectedintent` | Choice | Yes |
| Confidence | `ff_confidence` | Decimal | Yes |
| Equipment | `ff_equipment` | Lookup | No |
| Service Case | `ff_servicecase` | Lookup | No |
| Confirmation Required | `ff_confirmationrequired` | Yes/No | Yes |
| Action Status | `ff_actionstatus` | Choice | Yes |
| Sources | `ff_sources` | Multiple lines | No |
| Created On | Standard column | Date and time | Yes |

## Relationships

| Parent table | Child table | Relationship |
|---|---|---|
| Equipment | Service Case | One-to-many |
| Equipment | Automation Event | One-to-many |
| Equipment | Agent Interaction | One-to-many |
| Service Case | Automation Event | One-to-many |
| Service Case | Agent Interaction | One-to-many |

Deleting equipment should be restricted when related service cases
exist. Historical automation events and agent interactions should not
be deleted automatically.

## Choice Values

### Operating Status

- Operational
- Warning
- Critical
- Offline
- Maintenance

### Priority

- Low
- Medium
- High
- Critical

### Case Status

- Open
- Investigating
- Scheduled
- Resolved

### Source

- Manual
- Telemetry
- Automation
- AI Agent

### Automation Outcome

- No Action Required
- Service Case Created
- Duplicate Prevented
- Failed

### Agent Intent

- Equipment Status
- Fleet Summary
- Create Case
- Help
- Unknown

### Agent Action Status

- Not Requested
- Confirmation Required
- Service Case Created
- Existing Case Reused
- Failed

## Data Quality Rules

- Equipment ID and serial number must be unique.
- Fuel level must remain between 0 and 100.
- Health score must remain between 0 and 100.
- Every service case must reference valid equipment.
- Resolved cases require a resolution timestamp.
- AI-created service cases must record `AI Agent` as their source.
- Automation events must always record their outcome.
- Agent write actions must record whether confirmation was received.

## Auditing

Dataverse auditing should be enabled for:

- Service Case status
- Service Case priority
- Service Case assignment
- Automation Event outcome
- Agent Interaction intent
- Agent Interaction confidence
- Agent Interaction action status

This supports troubleshooting, compliance reviews, and measurement of
automation and agent reliability.