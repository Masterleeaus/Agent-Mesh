export const SUPPORT_CENTER_PERMISSIONS = {
  VIEW_TICKETS: 'support:view_tickets',
  CREATE_TICKET: 'support:create_ticket',
  DRAFT_REPLY: 'support:draft_reply',
  APPROVE_REPLY: 'support:approve_reply',
  ESCALATE_TICKET: 'support:escalate',
  MANAGE_TEMPLATES: 'support:manage_templates',
  MANAGE_QUEUES: 'support:manage_queues',
  VIEW_SLA: 'support:view_sla',
} as const;

export type SupportCenterPermission = typeof SUPPORT_CENTER_PERMISSIONS[keyof typeof SUPPORT_CENTER_PERMISSIONS];
