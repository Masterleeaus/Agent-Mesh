# Workflow Design

Design documentation for ResQAI workflow pipelines.

## Core Workflows
- **ticket-intake**: Ticket Created -> request-classifier -> support-reply-drafter -> Human Approval
- **dispute-resolution**: Dispute (under_review) -> resolution-advisor -> Human Review -> Approval
- **appointment-assignment**: Appointment Created -> tech-suggester -> Assignment

## Scheduled Workflows
- **account-health-monitoring**: Daily 2AM — health scan -> flag slipping -> create tasks
- **followup-slippage-detector**: Weekdays 6AM — detect overdue -> notify
- **customer-satisfaction-monitor**: Scheduled — survey -> analyze -> flag

## Operational Workflows
- **urgent-dispatch**: Urgent ticket -> dispatch -> notify
- **support-escalation-manager**: Escalated ticket -> route -> notify

All workflows currently blocked by missing agent runtime harnesses.
