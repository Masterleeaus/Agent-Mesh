import type { TicketDTO, CustomerDTO, AgentDTO, TemplateDTO, MessageDTO, TimelineEventDTO } from '../models/dto';
import type { SLAMetricsResponse } from '../models/api-responses';

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
const daysAhead = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();

export const mockCustomers: CustomerDTO[] = [
  { id: 'cust-001', name: 'Alice Johnson', email: 'alice@example.com', phone: '+1-555-0101', accountId: 'acc-001', accountName: 'Johnson Residence', createdAt: daysAgo(120) },
  { id: 'cust-002', name: 'Bob Smith', email: 'bob@example.com', phone: '+1-555-0102', accountId: 'acc-002', accountName: 'Smith Properties', createdAt: daysAgo(90) },
  { id: 'cust-003', name: 'Carol Davis', email: 'carol@example.com', phone: '+1-555-0103', createdAt: daysAgo(60) },
  { id: 'cust-004', name: 'Dan Wilson', email: 'dan@example.com', phone: '+1-555-0104', accountId: 'acc-004', accountName: 'Wilson LLC', createdAt: daysAgo(45) },
  { id: 'cust-005', name: 'Eve Martinez', email: 'eve@example.com', phone: '+1-555-0105', createdAt: daysAgo(30) },
  { id: 'cust-006', name: 'Frank Lee', email: 'frank@example.com', phone: '+1-555-0106', accountId: 'acc-006', accountName: 'Lee Holdings', createdAt: daysAgo(20) },
  { id: 'cust-007', name: 'Grace Kim', email: 'grace@example.com', phone: '+1-555-0107', createdAt: daysAgo(15) },
  { id: 'cust-008', name: 'Henry Brown', email: 'henry@example.com', phone: '+1-555-0108', accountId: 'acc-008', accountName: 'Brown & Co', createdAt: daysAgo(10) },
];

export const mockAgents: AgentDTO[] = [
  { id: 'agent-001', name: 'Sarah Connor', email: 'sarah@resqai.com', role: 'senior_agent', isOnline: true },
  { id: 'agent-002', name: 'Mike Peters', email: 'mike@resqai.com', role: 'agent', isOnline: true },
  { id: 'agent-003', name: 'Lisa Wong', email: 'lisa@resqai.com', role: 'agent', isOnline: false },
  { id: 'agent-004', name: 'Tom Rivera', email: 'tom@resqai.com', role: 'team_lead', isOnline: true },
  { id: 'agent-005', name: 'Jane Foster', email: 'jane@resqai.com', role: 'agent', isOnline: true },
];

export const mockTemplates: TemplateDTO[] = [
  { id: 'tpl-001', name: 'We are looking into it', body: 'Thank you for reaching out. Our team is looking into your issue and we will get back to you shortly.', category: 'general', createdAt: daysAgo(60), updatedAt: daysAgo(5) },
  { id: 'tpl-002', name: 'Service appointment scheduled', body: 'Your service appointment has been scheduled for {{date}}. A technician will arrive between {{time_window}}. Please ensure someone is available.', category: 'general', createdAt: daysAgo(50), updatedAt: daysAgo(10) },
  { id: 'tpl-003', name: 'Greeting - new ticket', body: 'Hello {{customer_name}}, thank you for contacting ResQAI support. We have received your request and a team member will follow up within 4 hours.', category: 'greeting', createdAt: daysAgo(40), updatedAt: daysAgo(3) },
  { id: 'tpl-004', name: 'Closing - issue resolved', body: 'We believe your issue has been resolved. Please let us know if you have any further questions. Thank you for choosing ResQAI!', category: 'closing', createdAt: daysAgo(30), updatedAt: daysAgo(2) },
  { id: 'tpl-005', name: 'Billing inquiry response', body: 'Regarding your billing inquiry, we have reviewed your account. Here are the details: {{details}}. If you have further questions, please call our billing team.', category: 'billing', createdAt: daysAgo(20), updatedAt: daysAgo(1) },
  { id: 'tpl-006', name: 'Technical troubleshooting', body: 'Please try the following steps: 1) Restart your unit. 2) Check the circuit breaker. 3) Ensure all connections are secure. If the issue persists, we will schedule a service visit.', category: 'technical', createdAt: daysAgo(10), updatedAt: daysAgo(0) },
];

export const mockTickets: TicketDTO[] = [
  { id: 'tkt-001', customerId: 'cust-001', customerName: 'Alice Johnson', subject: 'AC unit not cooling', message: 'Our AC unit stopped cooling overnight. It is blowing warm air. We have checked the thermostat settings and they seem fine. Please send a technician as soon as possible.', requestType: 'problem', channel: 'phone', urgency: 'high', status: 'new', createdAt: hoursAgo(1), updatedAt: hoursAgo(1) },
  { id: 'tkt-002', customerId: 'cust-002', customerName: 'Bob Smith', subject: 'Billing discrepancy on invoice #INV-2024-09', message: 'I noticed a charge on my recent invoice that does not match our service agreement. The invoice shows $450 but our contract says $350 monthly. Please review and correct.', requestType: 'billing', channel: 'email', urgency: 'normal', status: 'open', ownerId: 'agent-001', ownerName: 'Sarah Connor', createdAt: hoursAgo(4), updatedAt: hoursAgo(2) },
  { id: 'tkt-003', customerId: 'cust-003', customerName: 'Carol Davis', subject: 'How to reset my thermostat?', message: 'I recently changed my thermostat batteries and now the display shows error code E2. Can you walk me through the reset process?', requestType: 'question', channel: 'chat', urgency: 'low', status: 'new', createdAt: hoursAgo(2), updatedAt: hoursAgo(2) },
  { id: 'tkt-004', customerId: 'cust-004', customerName: 'Dan Wilson', subject: 'Water heater leaking - emergency', message: 'Our water heater is leaking onto the basement floor. There is standing water. This is an emergency situation. Please send someone immediately.', requestType: 'problem', channel: 'phone', urgency: 'critical', status: 'escalated', ownerId: 'agent-004', ownerName: 'Tom Rivera', escalationReason: 'Emergency - water damage risk', escalatedTo: 'Operations Manager', createdAt: hoursAgo(1), updatedAt: hoursAgo(0.5) },
  { id: 'tkt-005', customerId: 'cust-005', customerName: 'Eve Martinez', subject: 'Follow-up on previous repair', message: 'You repaired our dishwasher last week but it is making the same noise again. The repair ticket was #SRV-2024-08. I would like a follow-up visit.', requestType: 'problem', channel: 'portal', urgency: 'high', status: 'open', ownerId: 'agent-002', ownerName: 'Mike Peters', draftReply: 'Dear Eve, we apologize for the recurring issue. Let me look up your previous service record and schedule a follow-up visit at no charge.', createdAt: hoursAgo(6), updatedAt: hoursAgo(3) },
  { id: 'tkt-006', customerId: 'cust-006', customerName: 'Frank Lee', subject: 'Schedule annual maintenance', message: 'I would like to schedule our annual HVAC maintenance for next month. We prefer weekday mornings. Please let me know available dates.', requestType: 'feature_request', channel: 'email', urgency: 'low', status: 'new', createdAt: hoursAgo(8), updatedAt: hoursAgo(8) },
  { id: 'tkt-007', customerId: 'cust-007', customerName: 'Grace Kim', subject: 'Technician was late - compensation', message: 'Your technician arrived 3 hours late for our scheduled appointment yesterday. I took time off work. I would like compensation for the inconvenience.', requestType: 'billing', channel: 'phone', urgency: 'normal', status: 'pending', ownerId: 'agent-003', ownerName: 'Lisa Wong', slaDeadline: daysAhead(1), createdAt: daysAgo(1), updatedAt: hoursAgo(12) },
  { id: 'tkt-008', customerId: 'cust-008', customerName: 'Henry Brown', subject: 'New installation quote needed', message: 'We are building an addition to our home and need a quote for installing a new HVAC system for approximately 800 sq ft. Please provide options and pricing.', requestType: 'feature_request', channel: 'email', urgency: 'low', status: 'new', createdAt: hoursAgo(10), updatedAt: hoursAgo(10) },
  { id: 'tkt-009', customerId: 'cust-001', customerName: 'Alice Johnson', subject: 'Thank you - technician was great', message: 'I just wanted to say that the technician who came yesterday was wonderful. Very professional and fixed the issue quickly. Please pass on my thanks.', requestType: 'other', channel: 'portal', urgency: 'low', status: 'resolved', ownerId: 'agent-005', ownerName: 'Jane Foster', createdAt: daysAgo(2), updatedAt: daysAgo(1) },
  { id: 'tkt-010', customerId: 'cust-002', customerName: 'Bob Smith', subject: 'Second request - billing issue still open', message: 'I sent an email about a billing discrepancy 3 days ago and have not received a response. This is my second request. Please escalate if needed.', requestType: 'billing', channel: 'email', urgency: 'high', status: 'open', ownerId: 'agent-001', ownerName: 'Sarah Connor', escalationReason: 'Customer requested escalation - no response in 3 days', escalatedTo: 'Team Lead', createdAt: daysAgo(3), updatedAt: hoursAgo(5) },
  { id: 'tkt-011', customerId: 'cust-003', customerName: 'Carol Davis', subject: 'Appliance repair - refrigerator', message: 'Our refrigerator stopped working. The light is on but it is not cooling. It is a 3-year-old model under extended warranty.', requestType: 'problem', channel: 'phone', urgency: 'critical', status: 'escalated', ownerId: 'agent-004', ownerName: 'Tom Rivera', escalationReason: 'Spoiled food risk - priority dispatch needed', escalatedTo: 'Operations Manager', createdAt: hoursAgo(0.5), updatedAt: hoursAgo(0.2) },
  { id: 'tkt-012', customerId: 'cust-004', customerName: 'Dan Wilson', subject: 'Change appointment date', message: 'I need to move my appointment from this Friday to next Monday. Something urgent came up at work. The appointment is #APT-2024-10.', requestType: 'other', channel: 'chat', urgency: 'normal', status: 'pending', ownerId: 'agent-002', ownerName: 'Mike Peters', createdAt: hoursAgo(3), updatedAt: hoursAgo(2) },
];

export const mockMessages: Record<string, MessageDTO[]> = {
  'tkt-001': [
    { id: 'msg-001', ticketId: 'tkt-001', authorId: 'cust-001', authorName: 'Alice Johnson', authorRole: 'customer', body: 'Our AC unit stopped cooling overnight. It is blowing warm air. We have checked the thermostat settings and they seem fine.', createdAt: hoursAgo(1) },
  ],
  'tkt-002': [
    { id: 'msg-002', ticketId: 'tkt-002', authorId: 'cust-002', authorName: 'Bob Smith', authorRole: 'customer', body: 'I noticed a charge on my recent invoice that does not match our service agreement.', createdAt: hoursAgo(4) },
    { id: 'msg-003', ticketId: 'tkt-002', authorId: 'agent-001', authorName: 'Sarah Connor', authorRole: 'agent', body: 'Thank you for reaching out, Bob. Let me review your account and the invoice. I will get back to you shortly with clarification.', createdAt: hoursAgo(3) },
    { id: 'msg-004', ticketId: 'tkt-002', authorId: 'cust-002', authorName: 'Bob Smith', authorRole: 'customer', body: 'Thank you, Sarah. I appreciate the quick response.', createdAt: hoursAgo(2.5) },
  ],
  'tkt-004': [
    { id: 'msg-005', ticketId: 'tkt-004', authorId: 'cust-004', authorName: 'Dan Wilson', authorRole: 'customer', body: 'Our water heater is leaking onto the basement floor. There is standing water. This is an emergency.', createdAt: hoursAgo(1) },
    { id: 'msg-006', ticketId: 'tkt-004', authorId: 'agent-004', authorName: 'Tom Rivera', authorRole: 'agent', body: 'Dan, I have escalated this to our emergency dispatch team. A plumber will be dispatched within 30 minutes.', createdAt: hoursAgo(0.8) },
    { id: 'msg-007', ticketId: 'tkt-004', authorId: 'system', authorName: 'System', authorRole: 'system', body: 'Ticket escalated to Operations Manager — Emergency protocol activated.', createdAt: hoursAgo(0.5) },
  ],
  'tkt-005': [
    { id: 'msg-008', ticketId: 'tkt-005', authorId: 'cust-005', authorName: 'Eve Martinez', authorRole: 'customer', body: 'You repaired our dishwasher last week but it is making the same noise again.', createdAt: hoursAgo(6) },
    { id: 'msg-009', ticketId: 'tkt-005', authorId: 'agent-002', authorName: 'Mike Peters', authorRole: 'agent', body: 'I am sorry to hear the issue returned, Eve. Let me look up your previous service record (SRV-2024-08) and arrange a free follow-up visit.', createdAt: hoursAgo(4) },
  ],
  'tkt-010': [
    { id: 'msg-010', ticketId: 'tkt-010', authorId: 'cust-002', authorName: 'Bob Smith', authorRole: 'customer', body: 'I sent an email about a billing discrepancy 3 days ago and have not received a response. Please escalate.', createdAt: daysAgo(3) },
    { id: 'msg-011', ticketId: 'tkt-010', authorId: 'agent-001', authorName: 'Sarah Connor', authorRole: 'agent', body: 'Bob, I apologize for the delay. I see your earlier request and am prioritizing it now. Let me get this resolved today.', createdAt: hoursAgo(5) },
  ],
  'tkt-011': [
    { id: 'msg-012', ticketId: 'tkt-011', authorId: 'cust-003', authorName: 'Carol Davis', authorRole: 'customer', body: 'Our refrigerator stopped working. The light is on but it is not cooling. It is under warranty.', createdAt: hoursAgo(0.5) },
  ],
  'tkt-012': [
    { id: 'msg-013', ticketId: 'tkt-012', authorId: 'cust-004', authorName: 'Dan Wilson', authorRole: 'customer', body: 'I need to move my appointment from this Friday to next Monday.', createdAt: hoursAgo(3) },
    { id: 'msg-014', ticketId: 'tkt-012', authorId: 'agent-002', authorName: 'Mike Peters', authorRole: 'agent', body: 'I can help with that. Let me check what slots are available next Monday and update the appointment.', createdAt: hoursAgo(2.5) },
  ],
};

export const mockTimelines: Record<string, TimelineEventDTO[]> = {
  'tkt-001': [
    { id: 'tl-001', ticketId: 'tkt-001', type: 'created', description: 'Ticket created via phone call', actorName: 'Alice Johnson', createdAt: hoursAgo(1) },
  ],
  'tkt-002': [
    { id: 'tl-002', ticketId: 'tkt-002', type: 'created', description: 'Ticket created via email', actorName: 'Bob Smith', createdAt: hoursAgo(4) },
    { id: 'tl-003', ticketId: 'tkt-002', type: 'assigned', description: 'Assigned to Sarah Connor', actorName: 'System', createdAt: hoursAgo(3.5) },
    { id: 'tl-004', ticketId: 'tkt-002', type: 'replied', description: 'Agent replied to customer', actorName: 'Sarah Connor', createdAt: hoursAgo(3) },
  ],
  'tkt-004': [
    { id: 'tl-005', ticketId: 'tkt-004', type: 'created', description: 'Ticket created via phone (emergency)', actorName: 'Dan Wilson', createdAt: hoursAgo(1) },
    { id: 'tl-006', ticketId: 'tkt-004', type: 'assigned', description: 'Assigned to Tom Rivera', actorName: 'System', createdAt: hoursAgo(0.9) },
    { id: 'tl-007', ticketId: 'tkt-004', type: 'escalated', description: 'Escalated to Operations Manager — Emergency protocol', actorName: 'Tom Rivera', createdAt: hoursAgo(0.5) },
  ],
  'tkt-005': [
    { id: 'tl-008', ticketId: 'tkt-005', type: 'created', description: 'Ticket created via customer portal', actorName: 'Eve Martinez', createdAt: hoursAgo(6) },
    { id: 'tl-009', ticketId: 'tkt-005', type: 'assigned', description: 'Assigned to Mike Peters', actorName: 'System', createdAt: hoursAgo(5) },
    { id: 'tl-010', ticketId: 'tkt-005', type: 'replied', description: 'Agent replied with follow-up arrangement', actorName: 'Mike Peters', createdAt: hoursAgo(4) },
    { id: 'tl-011', ticketId: 'tkt-005', type: 'drafted', description: 'Draft reply created', actorName: 'Mike Peters', createdAt: hoursAgo(3) },
  ],
  'tkt-010': [
    { id: 'tl-012', ticketId: 'tkt-010', type: 'created', description: 'Ticket created via email', actorName: 'Bob Smith', createdAt: daysAgo(3) },
    { id: 'tl-013', ticketId: 'tkt-010', type: 'assigned', description: 'Assigned to Sarah Connor', actorName: 'System', createdAt: daysAgo(3) },
    { id: 'tl-014', ticketId: 'tkt-010', type: 'replied', description: 'Agent acknowledged and prioritized', actorName: 'Sarah Connor', createdAt: hoursAgo(5) },
    { id: 'tl-015', ticketId: 'tkt-010', type: 'escalated', description: 'Customer requested escalation — no response in 3 days', actorName: 'Bob Smith', createdAt: hoursAgo(5) },
  ],
  'tkt-011': [
    { id: 'tl-016', ticketId: 'tkt-011', type: 'created', description: 'Ticket created via phone (emergency)', actorName: 'Carol Davis', createdAt: hoursAgo(0.5) },
    { id: 'tl-017', ticketId: 'tkt-011', type: 'escalated', description: 'Escalated — refrigerator warranty priority', actorName: 'Tom Rivera', createdAt: hoursAgo(0.2) },
  ],
  'tkt-012': [
    { id: 'tl-018', ticketId: 'tkt-012', type: 'created', description: 'Ticket created via chat', actorName: 'Dan Wilson', createdAt: hoursAgo(3) },
    { id: 'tl-019', ticketId: 'tkt-012', type: 'assigned', description: 'Assigned to Mike Peters', actorName: 'System', createdAt: hoursAgo(2.5) },
    { id: 'tl-020', ticketId: 'tkt-012', type: 'replied', description: 'Agent offered to reschedule appointment', actorName: 'Mike Peters', createdAt: hoursAgo(2.5) },
  ],
};

export const mockSLAMetrics: SLAMetricsResponse = {
  compliancePercent: 87.3,
  breached: 3,
  total: 23,
  avgResponseTimeByChannel: {
    phone: 180,
    email: 14400,
    chat: 300,
    portal: 10800,
    social: 7200,
  },
  byAgent: [
    { id: 'sla-001', agentId: 'agent-001', agentName: 'Sarah Connor', totalTickets: 8, breached: 0, compliancePercent: 100 },
    { id: 'sla-002', agentId: 'agent-002', agentName: 'Mike Peters', totalTickets: 6, breached: 1, compliancePercent: 83.3 },
    { id: 'sla-003', agentId: 'agent-003', agentName: 'Lisa Wong', totalTickets: 4, breached: 1, compliancePercent: 75 },
    { id: 'sla-004', agentId: 'agent-004', agentName: 'Tom Rivera', totalTickets: 3, breached: 1, compliancePercent: 66.7 },
    { id: 'sla-005', agentId: 'agent-005', agentName: 'Jane Foster', totalTickets: 2, breached: 0, compliancePercent: 100 },
  ],
};
