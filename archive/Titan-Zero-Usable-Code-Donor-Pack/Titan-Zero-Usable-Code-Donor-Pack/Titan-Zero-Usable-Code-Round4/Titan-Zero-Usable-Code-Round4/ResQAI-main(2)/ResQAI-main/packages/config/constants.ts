// ──────────────────────────────────────────────
// Service type display labels
// ──────────────────────────────────────────────
export const SERVICE_LABELS: Record<string, string> = {
  ac_repair: 'AC repair',
  ac_maintenance: 'AC maintenance',
  appliance_repair: 'Appliance repair',
  plumbing_repair: 'Plumbing repair',
  electrical_repair: 'Electrical repair',
  general_maintenance: 'General maintenance',
  installation: 'Installation',
};

export function formatServiceType(type: string): string {
  return SERVICE_LABELS[type] || type.replace(/_/g, ' ');
}

// ──────────────────────────────────────────────
// Status color variants
// ──────────────────────────────────────────────
export const STATUS_VARIANTS: Record<string, string> = {
  scheduled: 'accent',
  in_progress: 'warn',
  completed: 'good',
  needs_followup: 'bad',
  cancelled: 'plain',
};

export const STATUS_COLOR_MAP: Record<string, string> = {
  accent: 'var(--accent)',
  warn: 'var(--warn)',
  good: 'var(--good)',
  bad: 'var(--bad)',
  plain: 'var(--plain)',
};

// ──────────────────────────────────────────────
// Resolution type labels
// ──────────────────────────────────────────────
export type ResolutionType = 'full_refund' | 'partial_refund' | 'redo_service' | 'discount_credit' | 'no_action' | 'escalate_legal';

export const RESOLUTION_LABELS: Record<ResolutionType, string> = {
  full_refund: 'Full refund',
  partial_refund: 'Partial refund',
  redo_service: 'Redo service',
  discount_credit: 'Discount credit',
  no_action: 'No action',
  escalate_legal: 'Escalate legal',
};

// ──────────────────────────────────────────────
// Status weight for ordering
// ──────────────────────────────────────────────
export const STATUS_WEIGHT: Record<string, number> = {
  open: 0,
  analyzing: 1,
  recommendation_ready: 2,
  approved: 3,
  rejected: 4,
  closed: 5,
};

// ──────────────────────────────────────────────
// Table names used across the platform
// ──────────────────────────────────────────────
export const TABLES = {
  customers: 'customers',
  technicians: 'technicians',
  tickets: 'tickets',
  appointments: 'appointments',
  disputes: 'disputes',
  tasks: 'tasks',
  operationsLog: 'operations_log',
  accounts: 'accounts',
  followups: 'followups',
} as const;

// ──────────────────────────────────────────────
// Agent names used across the platform
// ──────────────────────────────────────────────
export const AGENTS = {
  requestClassifier: 'request-classifier',
  supportReplyDrafter: 'support-reply-drafter',
  operationsCoordinator: 'operations-coordinator',
  resolutionAdvisor: 'resolution-advisor',
  accountHealthMonitor: 'account-health-monitor',
} as const;

// ──────────────────────────────────────────────
// Function names used across the platform
// ──────────────────────────────────────────────
export const FUNCTIONS = {
  accountHealthScan: 'account_health_scan',
  flagSlippingFollowups: 'flag_slipping_followups',
} as const;

// ──────────────────────────────────────────────
// Severity colors and labels
// ──────────────────────────────────────────────
export const SEVERITY_COLORS: Record<string, string> = {
  critical: '#a23b3b',
  high: '#c2683f',
  medium: '#c9a227',
  low: '#5c7a53',
};

export const BUCKET_LABELS: Record<string, string> = {
  overdue: 'Overdue',
  due_today: 'Due today',
  due_soon: 'Due soon',
};

// ──────────────────────────────────────────────
// Priority display colors (hex for inline styles)
// ──────────────────────────────────────────────
export const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#f44336',
  high: '#ff9800',
  normal: '#2196f3',
  low: '#4caf50',
};

// ──────────────────────────────────────────────
// Urgency badge variant mapping
// ──────────────────────────────────────────────
export const URGENCY_VARIANTS: Record<string, string> = {
  urgent: 'urgent',
  high: 'high',
  normal: 'normal',
  low: 'low',
};

// ──────────────────────────────────────────────
// Health status display labels
// ──────────────────────────────────────────────
export const HEALTH_LABELS: Record<string, string> = {
  healthy: 'Healthy',
  watch: 'watch',
  slipping: 'Slipping',
  critical: 'Critical',
};

// ──────────────────────────────────────────────
// Ticket status badge variant mapping
// ──────────────────────────────────────────────
export const TICKET_STATUS_VARIANTS: Record<string, string> = {
  new: 'urgent',
  classified: 'high',
  drafted: 'normal',
  approved_to_send: 'good',
  sent: 'good',
  closed: 'plain',
};

// ──────────────────────────────────────────────
// Dispute status badge variant mapping
// ──────────────────────────────────────────────
export const DISPUTE_STATUS_VARIANTS: Record<string, string> = {
  open: 'high',
  analyzing: 'normal',
  recommendation_ready: 'good',
  approved: 'good',
  rejected: 'plain',
  closed: 'plain',
};

// ──────────────────────────────────────────────
// Followup status badge variant mapping
// ──────────────────────────────────────────────
export const FOLLOWUP_STATUS_VARIANTS: Record<string, string> = {
  overdue: 'urgent',
  due: 'high',
  future: 'normal',
  done: 'good',
  completed: 'good',
  cancelled: 'plain',
};

// ──────────────────────────────────────────────
// Recommendation action type display colors
// ──────────────────────────────────────────────
export const RECOMMENDATION_TYPE_COLORS: Record<string, string> = {
  create_appointment: '#9c27b0',
  assign_technician: '#2196f3',
  schedule_followup: '#009688',
  create_task: '#ff9800',
  reassign_visit: '#e91e63',
};
