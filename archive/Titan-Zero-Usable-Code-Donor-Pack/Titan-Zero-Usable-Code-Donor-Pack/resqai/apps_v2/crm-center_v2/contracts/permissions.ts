export const CRMPermissions = {
  VIEW_DASHBOARD: 'crm:view_dashboard',
  VIEW_ACCOUNTS: 'crm:view_accounts',
  MANAGE_FOLLOWUPS: 'crm:manage_followups',
  RUN_SCANS: 'crm:run_scans',
  VIEW_RISKS: 'crm:view_risks',
  MANAGE_ACCOUNTS: 'crm:manage_accounts',
} as const;

export type CRMPermission = typeof CRMPermissions[keyof typeof CRMPermissions];
