# ResQAI — Manual QA Checklist

## Support Queue

### Ticket Loading
- [ ] Page loads without errors (check console)
- [ ] Loading spinner/state is shown while tickets fetch
- [ ] Tickets appear in the left panel after load
- [ ] Empty state shown when no tickets exist
- [ ] Error state shown when fetch fails (with retry option)

### Filtering
- [ ] Default filter shows "Open" tickets (status: new, classified, drafted, approved_to_send)
- [ ] "Urgent" filter shows only tickets with urgency=urgent
- [ ] "New" filter shows only tickets with status=new
- [ ] "Awaiting Approval" filter shows only tickets with approved_to_send=false and status=drafted
- [ ] "All" filter shows all tickets regardless of status
- [ ] Filter count badges display correct ticket counts
- [ ] Switching filters keeps selected ticket in detail view (if still visible)

### Ticket Selection
- [ ] Clicking a ticket selects it and shows detail panel on right
- [ ] Selected ticket has visual highlight
- [ ] Clicking another ticket switches detail view
- [ ] Deselecting (clicking empty space) closes detail panel

### Classification
- [ ] "Classify (AI)" button is visible on tickets with status=new
- [ ] Button is hidden/disabled for non-new tickets
- [ ] Clicking shows loading state while agent processes
- [ ] On success: ticket status changes to `classified`, fields populate
- [ ] On error: error message shown, ticket remains unchanged
- [ ] Classified ticket appears in the correct filter tab

### Draft Reply
- [ ] "Draft reply (AI)" button is visible on tickets with status=classified or drafted
- [ ] Button is hidden/disabled for other statuses
- [ ] Clicking shows loading state while agent processes
- [ ] On success: draft_reply field populated, status changes to `drafted`
- [ ] On error: error message shown, ticket remains unchanged
- [ ] Draft reply text appears editable in the detail panel

### Approve
- [ ] "Approve" button visible on tickets with status=drafted
- [ ] Button is hidden/disabled for other statuses
- [ ] Clicking shows confirmation or direct approval
- [ ] On success: approved_to_send=true, status stays drafted
- [ ] Operations_log entry created for approval

### Mark Sent
- [ ] "Mark sent" button visible on tickets with approved_to_send=true
- [ ] Button is hidden/disabled for other states
- [ ] Clicking changes status to `sent`
- [ ] Operations_log entry created

### Close Ticket
- [ ] "Close" button visible on tickets in non-terminal states (not sent/closed)
- [ ] Clicking changes status to `closed`
- [ ] Operations_log entry created
- [ ] Closed ticket no longer appears in "Open" filter

### Error Handling
- [ ] SDK initialization failure shows meaningful error
- [ ] Agent timeout (>135s) shows timeout error
- [ ] Network error during update shows retry option
- [ ] Invalid state transition shows error (e.g., trying to approve already-sent ticket)

### Loading States
- [ ] Initial load shows spinner
- [ ] Each action button shows per-action loading state
- [ ] Simultaneous actions don't cause UI glitches
- [ ] Loading states prevent double-clicks

---

## CRM Tracker

### Account Loading
- [ ] Page loads without errors
- [ ] Loading state shown while fetching accounts + followups
- [ ] Account list populates with health badges
- [ ] Empty state when no accounts exist
- [ ] Error state with retry

### Stats Row
- [ ] 6 KPI cards render: Critical, Slipping, watch, Healthy, Overdue Follow-ups, Open Follow-ups
- [ ] Counts match the fetched data
- [ ] Cards are color-coded appropriately

### Health Filter
- [ ] Default shows "All" accounts
- [ ] "Healthy" shows only health=healthy accounts
- [ ] "watch" shows only health=watch accounts
- [ ] "Slipping" shows only health=slipping accounts
- [ ] "Critical" shows only health=critical accounts
- [ ] Filter chip for current filter is visually active
- [ ] Account count updates per filter

### Account Selection
- [ ] Clicking account card opens detail panel on right
- [ ] Account detail shows: name, status, relationship, service type, health score, dates, dispute/follow-up counts, revenue, owner, notes
- [ ] Follow-ups table shows in detail panel
- [ ] Follow-up status badges display correctly

### Slipping Alerts
- [ ] Alerts section renders with color-coded severity
- [ ] Critical alerts shown first, then high, medium, low
- [ ] Clicking an alert selects the associated account
- [ ] Empty state when no slipping follow-ups exist

### Health Scan
- [ ] "Run health scan" button is visible
- [ ] Clicking shows loading state
- [ ] Scan runs: account_health_scan → flag_slipping_followups → refresh
- [ ] Scan summary displays after completion
- [ ] Top risk accounts shown in scan results
- [ ] Error handling if function fails
- [ ] Double-click prevention during scan

### Refresh
- [ ] Refresh button reloads data without scanning
- [ ] Loading state shown during refresh
- [ ] Data updates after refresh

---

## Ops Dashboard

### Dashboard Loading
- [ ] Page loads without errors
- [ ] Loading state shown while fetching all data sources
- [ ] All sections populate after load
- [ ] Error state with retry

### KPI Cards
- [ ] 5 KPI cards render: Open Tickets (+ urgent count), Active Appointments (+ in-progress), Open Disputes (+ awaiting approval), Overdue Tasks (+ all-clear/action-required)
- [ ] Counts match fetched data
- [ ] Color coding is correct (green/amber/red)

### Urgent Dispatch
- [ ] Section visible only when urgent tickets exist
- [ ] Hidden when no urgent tickets
- [ ] Each urgent ticket links to correct support-queue URL with focus param
- [ ] Ticket urgency badge shows correctly

### Coordinator Section
- [ ] "Run Coordinator" button visible
- [ ] Initial state shows prompt to run coordinator
- [ ] Clicking shows loading state during agent call
- [ ] Recommendations render as cards with type/priority badges
- [ ] Summary text displays above recommendations
- [ ] Empty state if coordinator returns no recommendations
- [ ] Error state with retry if agent call fails
- [ ] Can re-run coordinator to get fresh recommendations

### Operations Log
- [ ] Last 8 operations_log entries display
- [ ] Columns: timestamp, actor, action, result
- [ ] Empty state when no log entries
- [ ] New entries appear after coordinator run

### Refresh
- [ ] Refresh button reloads all data
- [ ] Loading state shown during refresh
- [ ] KPI counts update after refresh

---

## Appointment Board

### Appointment Loading
- [ ] Page loads without errors
- [ ] Loading state shown while fetching appointments, customers, technicians
- [ ] Appointments populate in grouped sections
- [ ] Empty state when no appointments
- [ ] Error state with retry

### KPI Cards
- [ ] 3 KPI cards render: Today count, Unassigned count, Needs follow-up count
- [ ] Counts match grouped appointment data

### Grouped Sections
- [ ] "Today" section shows today's appointments
- [ ] "Upcoming" section shows future appointments
- [ ] "Needs follow-up" section shows appointments needing attention
- [ ] "Past" section shows last 10 past appointments
- [ ] Each section has correct count in header
- [ ] Appointments sorted correctly within each section

### Appointment Selection
- [ ] Clicking a row opens detail panel on right
- [ ] Detail shows: service type, date, customer info, status badge, technician, notes
- [ ] Clicking another row switches detail view
- [ ] Closing detail panel returns to full-width view

### Technician Assignment
- [ ] Technician picker shows active techs with skill + availability
- [ ] Clicking a tech chip assigns them
- [ ] Assigned tech shows in appointment detail
- [ ] Operations_log entry created for assignment
- [ ] Error handling if assignment fails

### AI Tech Suggestion
- [ ] "Suggest tech (AI)" button visible
- [ ] Clicking calls operations-coordinator agent
- [ ] Loading state during agent call
- [ ] Suggested tech shown with score and rationale
- [ ] Can apply the suggestion directly
- [ ] Can still pick manually after suggestion
- [ ] Error handling if agent call fails

### Status Actions
- [ ] Status buttons match current state:
  - [ ] Scheduled → In Progress, Needs Follow-up, Cancel
  - [ ] In Progress → Completed, Needs Follow-up, Cancel
  - [ ] Needs Follow-up → In Progress, Completed, Cancel
- [ ] Each status change writes to operations_log
- [ ] Status badge updates after change
- [ ] Error handling if update fails

---

## Resolution Center

### Dispute Loading
- [ ] Page loads without errors
- [ ] Loading state shown while fetching disputes, appointments, customers
- [ ] Dispute list populates
- [ ] Empty state when no disputes
- [ ] Error state with retry

### KPI Cards
- [ ] 3 KPI cards render: Awaiting approval, Total open, Resolved
- [ ] Counts match dispute data

### Dispute List
- [ ] Disputes sorted by status priority (open → analyzing → recommendation_ready → approved → rejected → closed)
- [ ] Status badges display correctly with colors
- [ ] Columns: customer name, service type, date, resolution, confidence, age
- [ ] Confidence bar shows correct color (red < 60%, yellow < 85%, green >= 85%)

### Dispute Selection
- [ ] Clicking dispute row opens detail panel
- [ ] Detail shows all dispute information
- [ ] Clicking another row switches detail

### Evidence Panel
- [ ] 3-column grid: Customer claim, Provider claim, Evidence summary
- [ ] Content displays correctly
- [ ] Handles long text (scrollable or truncated)

### AI Analysis
- [ ] "Analyze (AI)" button visible on open/analyzing disputes
- [ ] Loading state during agent call
- [ ] On success: recommendation, confidence, reasoning populate
- [ ] Confidence bar animates
- [ ] Recommendation type displays with label
- [ ] Error handling if agent fails

### Approve Resolution
- [ ] "Approve" button visible on disputes with recommendation_ready status
- [ ] Clicking sets status to approved
- [ ] Customer status updated based on resolution type
- [ ] Operations_log entry created

### Reject
- [ ] "Reject" button visible on disputes with recommendation_ready status
- [ ] Clicking sets status to rejected
- [ ] Operations_log entry created

### Close
- [ ] "Close" button visible on non-closed disputes
- [ ] Clicking sets status to closed
- [ ] Operations_log entry created

### Override Resolution
- [ ] "Override" option available
- [ ] Textarea appears for override reason
- [ ] Submitting override logs to operations_log
- [ ] Dispute status updated appropriately

### Error Handling
- [ ] Analysis failure shows error with retry option
- [ ] Approval failure does not change state
- [ ] Network errors show meaningful messages

---

## Cross-App Integration Checks

### Navigation
- [ ] All 5 apps accessible from each app's navigation bar
- [ ] Navigation links point to correct app URLs
- [ ] Navigation styling consistent across apps

### Shared SDK
- [ ] All apps initialize Lemma SDK successfully
- [ ] Token sharing works (authenticate once, use across apps)
- [ ] No cross-app state leakage

### Environment
- [ ] All apps use the same Lemma pod ID
- [ ] All apps use the same API URL
- [ ] All apps use the same auth URL

---

## Edge Cases

### Empty States
- [ ] Support Queue: no tickets
- [ ] CRM Tracker: no accounts
- [ ] Ops Dashboard: no data from any table
- [ ] Appointment Board: no appointments
- [ ] Resolution Center: no disputes

### Error States
- [ ] Lemma SDK fails to load
- [ ] Lemma pod unreachable
- [ ] Agent timeout
- [ ] Function execution error
- [ ] Network offline
- [ ] Invalid data returned from API

### Loading States
- [ ] Initial page load
- [ ] Agent invocation
- [ ] Function execution
- [ ] Data refresh
- [ ] Large dataset loading
