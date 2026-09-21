export const AppointmentPermissions = {
  ViewSchedule: 'appointment:view_schedule',
  ViewQueue: 'appointment:view_queue',
  ViewDetail: 'appointment:view_detail',
  ViewHistory: 'appointment:view_history',
  ViewReports: 'appointment:view_reports',
  ViewCancelled: 'appointment:view_cancelled',
  ViewCompleted: 'appointment:view_completed',
  Create: 'appointment:create',
  Edit: 'appointment:edit',
  AssignTechnician: 'appointment:assign_technician',
  Reschedule: 'appointment:reschedule',
  Cancel: 'appointment:cancel',
  Complete: 'appointment:complete',
  ManageServices: 'appointment:manage_services',
  ManageSettings: 'appointment:manage_settings',
  Export: 'appointment:export',
  BatchAction: 'appointment:batch_action',
} as const;

export type AppointmentPermission = (typeof AppointmentPermissions)[keyof typeof AppointmentPermissions];
