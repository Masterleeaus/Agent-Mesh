export interface CrossAppEventMap {
  'ticket:created': { ticketId: string; customerId: string; subject: string; urgency: string };
  'ticket:updated': { ticketId: string; status: string };
  'ticket:escalated': { ticketId: string; reason: string; escalatedTo: string };
  'appointment:created': { appointmentId: string; customerId: string; technicianId?: string; date: string };
  'appointment:rescheduled': { appointmentId: string; oldDate: string; newDate: string };
  'appointment:assigned': { appointmentId: string; technicianId: string; technicianName: string };
  'appointment:completed': { appointmentId: string; outcome: string };
  'dispute:created': { disputeId: string; appointmentId: string; reason: string };
  'dispute:resolved': { disputeId: string; resolution: string };
  'customer:created': { customerId: string; name: string; accountId?: string };
  'customer:updated': { customerId: string };
  'followup:created': { followupId: string; accountId: string; priority: string };
  'followup:completed': { followupId: string; accountId: string };
  'task:created': { taskId: string; accountId: string; title: string; priority: string };
  'task:completed': { taskId: string; accountId: string };
  'workflow:started': { workflowId: string; type: string };
  'workflow:completed': { workflowId: string; type: string; outcome: string };
  'notification:new': { notificationId: string; userId: string; title: string; type: string };
  'data:refreshed': { entity: string; id: string };
}

export type CrossAppEvent = keyof CrossAppEventMap;
export const CROSS_APP_CHANNEL = 'resqai-cross-app';
