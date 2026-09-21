export const OPERATIONS_CENTER_PERMISSIONS = {
  VIEW_DASHBOARD: 'ops:view_dashboard',
  VIEW_DISPATCH_QUEUE: 'ops:view_dispatch_queue',
  CREATE_DISPATCH: 'ops:create_dispatch',
  VIEW_LIVE_BOARD: 'ops:view_live_board',
  VIEW_ASSIGNMENTS: 'ops:view_assignments',
  ASSIGN_TECHNICIAN: 'ops:assign_technician',
  REASSIGN_TECHNICIAN: 'ops:reassign_technician',
  MONITOR_TECHNICIANS: 'ops:monitor_technicians',
  VIEW_ESCALATIONS: 'ops:view_escalations',
  ESCALATE_OPERATION: 'ops:escalate_operation',
  CLOSE_OPERATION: 'ops:close_operation',
  UPDATE_OPERATION_STATUS: 'ops:update_operation_status',
  VIEW_TIMELINE: 'ops:view_timeline',
  VIEW_DAILY_OPS: 'ops:view_daily_ops',
  VIEW_REGIONAL_OPS: 'ops:view_regional_ops',
  VIEW_COMPLETED_OPS: 'ops:view_completed_ops',
  VIEW_REPORTS: 'ops:view_reports',
  SEARCH_OPERATIONS: 'ops:search_operations',
} as const;

export type OperationsCenterPermission = typeof OPERATIONS_CENTER_PERMISSIONS[keyof typeof OPERATIONS_CENTER_PERMISSIONS];
