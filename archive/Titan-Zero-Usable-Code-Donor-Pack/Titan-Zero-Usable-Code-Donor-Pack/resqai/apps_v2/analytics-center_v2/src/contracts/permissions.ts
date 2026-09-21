export const ANALYTICS_PERMISSIONS = {
  VIEW_EXECUTIVE: 'analytics:view_executive',
  VIEW_SUPPORT: 'analytics:view_support',
  VIEW_OPERATIONS: 'analytics:view_operations',
  VIEW_APPOINTMENTS: 'analytics:view_appointments',
  VIEW_TECHNICIANS: 'analytics:view_technicians',
  VIEW_CUSTOMERS: 'analytics:view_customers',
  VIEW_CRM: 'analytics:view_crm',
  VIEW_RESOLUTION: 'analytics:view_resolution',
  VIEW_SLA: 'analytics:view_sla',
  VIEW_PRODUCTIVITY: 'analytics:view_productivity',
  VIEW_TRENDS: 'analytics:view_trends',
  VIEW_FORECASTING: 'analytics:view_forecasting',
  VIEW_ACCOUNTS: 'analytics:view_accounts',
  VIEW_DISPUTES: 'analytics:view_disputes',
  VIEW_AUDIT: 'analytics:view_audit',
  VIEW_HEALTH: 'analytics:view_health',
  MANAGE_REPORTS: 'analytics:manage_reports',
  MANAGE_SCHEDULES: 'analytics:manage_schedules',
  EXPORT_DATA: 'analytics:export_data',
  VIEW_ALL: 'analytics:view_all',
} as const;

export type AnalyticsPermission = (typeof ANALYTICS_PERMISSIONS)[keyof typeof ANALYTICS_PERMISSIONS];
