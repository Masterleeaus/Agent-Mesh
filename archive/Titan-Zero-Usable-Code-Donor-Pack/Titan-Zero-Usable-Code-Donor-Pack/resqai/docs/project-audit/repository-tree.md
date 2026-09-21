# Repository Tree — ResQAI

Generated: 2026-06-28
Mode: Read-Only Audit

```
H:\HARSH_PROJET\LEMMA CLI\ResQAI\
├── .env                                   # Active env (3 vars, contains live pod ID)
├── .env.example                           # Template env (23 vars documented)
├── .gitignore
├── .npmrc                                 # legacy-peer-deps=true
├── README.md                              # Project overview
├── ResQAI.code-workspace                  # VS Code workspace
├── CONNECTOR_INTEGRATION_REPORT.md         # Connector usage documentation
├── agent_test_input.json                  # Test input for agent
├── check_urgency_fn.json                  # Function JSON stub (embedded)
├── package.json                           # Root workspace config
├── package-lock.json
├── run_input.json                         # Test input
├── test_fn_update.json                    # Test input
├── test_fn_urgency.json                   # Test input
├── test_ticket.json                       # Test ticket fixture
├── test_ticket2.json                      # Test ticket fixture
├── test_ticket3.json                      # Test ticket fixture
├── tsconfig.json                          # Root TS config (scripts only)
├── update_perms.json                      # Permission update fixture
├── update_ticket_fn.json                  # Function JSON stub (embedded)
├── workflow_graph.json                    # Workflow graph definition
│
├── .github/
│   └── workflows/                         # EMPTY — no CI workflows
│
├── agents/
│   ├── account-health-monitor/
│   │   ├── agent.json
│   │   ├── input-schema.json
│   │   ├── instruction.md
│   │   ├── output-schema.json
│   │   ├── permissions.json
│   │   ├── README.md
│   │   ├── tool-access.md
│   │   └── workflow-role.md
│   ├── operations-coordinator/
│   │   ├── agent.json
│   │   ├── input-schema.json
│   │   ├── instruction.md
│   │   ├── output-schema.json
│   │   ├── permissions.json
│   │   ├── README.md
│   │   ├── tool-access.md
│   │   └── workflow-role.md
│   ├── request-classifier/
│   │   ├── agent.json
│   │   ├── input-schema.json
│   │   ├── instruction.md
│   │   ├── output-schema.json
│   │   ├── permissions.json
│   │   ├── README.md
│   │   ├── tool-access.md
│   │   └── workflow-role.md
│   ├── resolution-advisor/
│   │   ├── agent.json
│   │   ├── input-schema.json
│   │   ├── instruction.md
│   │   ├── output-schema.json
│   │   ├── permissions.json
│   │   ├── README.md
│   │   ├── tool-access.md
│   │   └── workflow-role.md
│   └── support-reply-drafter/
│       ├── agent.json
│       ├── input-schema.json
│       ├── instruction.md
│       ├── output-schema.json
│       ├── permissions.json
│       ├── README.md
│       ├── tool-access.md
│       └── workflow-role.md
│
├── apps/
│   ├── appointment-board/
│   │   ├── .env / .env.example
│   │   ├── App.tsx / App.css
│   │   ├── ARCHITECTURE.md / README.md
│   │   ├── index.html / main.tsx
│   │   ├── vite.config.ts / tsconfig.json
│   │   ├── vite-env.d.ts
│   │   ├── package.json / package-lock.json
│   │   ├── components/
│   │   │   ├── AppointmentDetail.tsx
│   │   │   ├── AppointmentGroup.tsx
│   │   │   ├── KpiCards.tsx
│   │   │   └── TechnicianPicker.tsx
│   │   ├── hooks/
│   │   │   └── useAppointments.ts
│   │   ├── pages/
│   │   │   └── AppointmentBoardPage.tsx
│   │   ├── routes/
│   │   │   └── index.tsx
│   │   ├── services/
│   │   │   └── appointment-service.ts
│   │   ├── state/
│   │   │   └── atoms.ts
│   │   └── types/
│   │       └── index.ts
│   │
│   ├── crm-tracker/ (same structure)
│   │   ├── components/: AccountDetail, StatsRow, SlippingAlerts, HealthScanPanel, FilterBar, AccountList
│   │   ├── hooks/: useCrm.ts
│   │   ├── pages/: CrmTrackerPage.tsx
│   │   ├── routes/: index.tsx
│   │   ├── services/: crm-service.ts
│   │   ├── state/: atoms.ts
│   │   └── types/: index.ts
│   │
│   ├── ops-dashboard/ (same structure)
│   │   ├── components/: KpiRow, AlertBanner, TicketCard, ActionPanel, CapacityRow, RecentActivity
│   │   ├── hooks/: useDashboard.ts
│   │   ├── pages/: OpsDashboardPage.tsx
│   │   ├── routes/: index.tsx
│   │   ├── services/: dashboard-service.ts
│   │   ├── state/: atoms.ts
│   │   └── types/: index.ts
│   │
│   ├── resolution-center/ (same structure)
│   │   ├── components/: DisputeList, DisputeDetail, ResolutionForm
│   │   ├── hooks/: useDisputes.ts
│   │   ├── pages/: ResolutionCenterPage.tsx
│   │   ├── routes/: index.tsx
│   │   ├── services/: dispute-service.ts
│   │   ├── state/: atoms.ts
│   │   └── types/: index.ts
│   │
│   └── support-queue/ (same structure + extra src/)
│       ├── components/: TicketCard, QueueFilters, DraftPreview
│       ├── hooks/: useQueue.ts
│       ├── pages/: SupportQueuePage.tsx
│       ├── routes/: index.tsx
│       ├── services/: queue-service.ts
│       ├── src/ (extra directory not present in other apps)
│       ├── state/: atoms.ts
│       └── types/: index.ts
│
├── archive/
│   ├── apps/
│   │   └── shared/
│   │       ├── lemma-sdk.ts               # Older browser-based SDK
│   │       └── types.ts                   # Duplicate of shared/types/index.ts
│   └── reports/
│       ├── CLEANUP_REPORT.md
│       ├── DEPENDENCY_REPORT.md
│       ├── PROJECT_HEALTH.md
│       ├── REMAINING_WORK.md
│       ├── TREE_AFTER_REFACTOR.md
│       ├── UNUSED_FILES.md
│       └── WORKSPACE_MIGRATION_REPORT.md
│
├── database/
│   ├── docs/
│   │   ├── account-health-scan.json
│   │   ├── accounts-records.json
│   │   ├── appointments-records.json
│   │   ├── customers-records.json
│   │   ├── disputes-records.json
│   │   ├── flag-slipping-followups.json
│   │   ├── followups-records.json
│   │   ├── operations_log-records.json
│   │   ├── tasks-records.json
│   │   ├── technicians-records.json
│   │   └── tickets-records.json
│   └── migrations/
│       └── 001_tickets_add_status_values_and_column.sql
│
├── docs/
│   ├── README.md
│   ├── AGENT_REVIEW.md                    # Overlaps with agents.md
│   ├── ARCHITECTURE_V2.md                 # Overlaps with architecture.md
│   ├── DATABASE_REVIEW.md                 # Overlaps with database.md
│   ├── DEPENDENCY_AUDIT.md
│   ├── DUPLICATE_CODE_REPORT.md
│   ├── FUNCTION_REVIEW.md                 # Overlaps with functions.md
│   ├── INTEGRATION_TEST_PLAN.md
│   ├── PERFORMANCE_REPORT.md
│   ├── PHASE6_PREPARATION.md
│   ├── PROJECT_HEALTH_V2.md
│   ├── PROJECT_STATUS.md
│   ├── REACT_OPTIMIZATION_REPORT.md
│   ├── SECURITY_REPORT.md
│   ├── SERVICE_LAYER_REPORT.md
│   ├── SUMMARY.md
│   ├── WORKFLOW_DESIGN.md
│   ├── agents.md                          # Overlaps with AGENT_REVIEW.md
│   ├── applications.md
│   ├── architecture.md                    # Overlaps with ARCHITECTURE_V2.md
│   ├── database.md                        # Overlaps with DATABASE_REVIEW.md
│   ├── deployment.md
│   ├── deployment-summary.md
│   ├── functions.md                       # Overlaps with FUNCTION_REVIEW.md
│   ├── integration-status.md
│   ├── platform-validation-report.md
│   ├── resource-map.md
│   ├── roadmap.md
│   ├── setup.md
│   ├── troubleshooting.md
│   ├── apps/
│   │   ├── appointment-board.md           # Overlaps with apps/*/ARCHITECTURE.md
│   │   ├── crm-tracker.md
│   │   ├── ops-dashboard.md
│   │   ├── resolution-center.md
│   │   └── support-queue.md
│   ├── archive/
│   │   ├── README.md
│   │   ├── OLD_architecture/ (5 files)
│   │   ├── OLD_implementation/ (1 file)
│   │   ├── OLD_recovery/ (2 files)
│   │   └── OLD_validation/ (6 files)
│   ├── testing/
│   │   └── qa-checklist.md
│   └── project-audit/                    # ← CURRENT REPORT DIRECTORY
│
├── functions/
│   ├── account-health-scan/               # Python
│   │   ├── function.json, README.md
│   │   ├── src/: __init__.py, handler.py, logic.py, models.py
│   │   ├── schemas/: input.json, output.json
│   │   └── tests/: __init__.py, test_logic.py, fixtures/ (empty)
│   ├── assign_appointment_technician/     # Python (inline)
│   │   ├── assign_appointment_technician.json
│   │   └── code.py
│   ├── check-ticket-urgency/              # Python
│   │   ├── function.json
│   │   ├── src/: __init__.py, handler.py, models.py
│   │   ├── schemas/: input.json, output.json
│   │   └── tests/: __init__.py, test_logic.py
│   ├── collect_resolved_tickets/          # Python (inline)
│   │   ├── collect_resolved_tickets.json
│   │   └── code.py
│   ├── finalize_slippage_review/          # Python (inline)
│   │   ├── finalize_slippage_review.json
│   │   └── code.py
│   ├── finalize-dispatch/                 # Python (inline)
│   │   ├── finalize-dispatch.json
│   │   └── code.py
│   ├── flag-slipping-followups/           # Python
│   │   ├── function.json, README.md
│   │   ├── src/: __init__.py, handler.py, logic.py, models.py
│   │   ├── schemas/: input.json, output.json
│   │   └── tests/: __init__.py, test_logic.py, fixtures/ (empty)
│   ├── resolve_dispute/                   # Python (inline)
│   │   ├── resolve_dispute.json
│   │   └── code.py
│   ├── shared/                            # Python shared utilities
│   │   ├── __init__.py
│   │   ├── cli.py
│   │   └── fixture_loader.py
│   ├── update_account_health_status/      # Python (inline)
│   │   ├── update_account_health_status.json
│   │   └── code.py
│   └── update-ticket-record/              # Python
│       ├── function.json
│       ├── src/: __init__.py, handler.py, models.py
│       ├── schemas/: input.json, output.json
│       └── tests/: __init__.py, test_logic.py
│
├── infrastructure/                        # EMPTY
│
├── scripts/
│   ├── build.ts / clean.ts / dev.ts / dev.cmd / seed.ts / test.ts / validate.ts
│
├── shared/
│   ├── config/
│   │   ├── agents.ts
│   │   ├── constants.ts
│   │   ├── environment.ts
│   │   ├── index.ts
│   │   ├── paths.ts
│   │   └── theme.ts
│   ├── sdk/
│   │   └── lemma-sdk.ts
│   ├── types/
│   │   └── index.ts
│   ├── ui/
│   │   ├── Avatar.tsx, Badge.tsx, Button.tsx, Card.tsx,
│   │   ├── EmptyState.tsx, ErrorBox.tsx, LoadingSpinner.tsx,
│   │   ├── Modal.tsx, SectionHeader.tsx, SkeletonLoader.tsx,
│   │   ├── StatusBadge.tsx, TableContainer.tsx
│   │   └── index.ts
│   └── utils/
│       ├── date.ts, filtering.ts, index.ts, number.ts,
│       ├── service-helpers.ts, sorting.ts, string.ts
│
├── node_modules/                          # Ignored (npm dependencies)
│
└── workflows/
    ├── account-health-monitoring.json     # ACTIVE, schedule 0 2 * * *
    ├── account-health.json                # DRAFT
    ├── appointment-reminders.json         # DRAFT
    ├── daily-standup.json                 # DRAFT
    ├── dispute-resolution.json            # ACTIVE, datastore event
    ├── followup-slippage.json             # DRAFT
    ├── ticket-intake-REPORT.md            # Workflow documentation
    ├── ticket-intake.json                 # ACTIVE, datastore event
    ├── urgent-dispatch.json               # (unknown status)
    ├── account-health-monitoring/
    │   └── account-health-monitoring.json # DUPLICATE naming
    ├── appointment-assignment/
    │   └── appointment-assignment.json
    ├── customer-satisfaction-monitor/
    │   └── customer-satisfaction-monitor.json
    ├── followup-slippage-detector/
    │   └── followup-slippage-detector.json
    ├── support-escalation-manager/
    │   └── support-escalation-manager.json
    └── urgent-dispatch/
        └── urgent-dispatch.json           # DUPLICATE naming
```

## Summary Statistics

| Category | Count |
|----------|-------|
| Total files (excl node_modules) | ~210 |
| Source files (TS/TSX/PY/SQL) | ~85 |
| Configuration files (JSON/YML/CMD) | ~40 |
| Documentation files (MD) | ~50 |
| Data/fixture files (JSON) | ~20 |
| Build artifacts (dist/) | ~5 dirs |
| Cache dirs (node_modules) | 6 |
| Empty directories | 2 (infrastructure/, .github/workflows/) |

**Total app source files (TSX/TS):** ~65
**Total Python function files:** ~25
**Total workflow definitions:** 12 JSON + 1 MD report
