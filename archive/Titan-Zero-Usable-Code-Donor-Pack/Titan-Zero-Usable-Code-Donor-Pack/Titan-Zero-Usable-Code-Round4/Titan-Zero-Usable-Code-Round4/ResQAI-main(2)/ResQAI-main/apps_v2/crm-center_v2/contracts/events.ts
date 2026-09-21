export const AccountEvents = {
  HEALTH_SCAN_COMPLETED: 'account.health.scan.completed',
  HEALTH_CHANGED: 'account.health.changed',
  FOLLOWUP_CREATED: 'followup.created',
  FOLLOWUP_SLIPPAGE_DETECTED: 'followup.slippage.detected',
} as const;

export interface HealthScanCompletedPayload {
  accountId: string;
  accountName: string;
  score: number;
  previousScore: number | null;
  status: string;
  scannedAt: string;
}

export interface HealthChangedPayload {
  accountId: string;
  accountName: string;
  previousStatus: string;
  newStatus: string;
  changedAt: string;
}

export interface FollowupCreatedPayload {
  followupId: string;
  accountId: string;
  subject: string;
  priority: string;
  dueDate: string;
  owner: string;
}

export interface FollowupSlippageDetectedPayload {
  followupId: string;
  accountId: string;
  accountName: string;
  subject: string;
  dueDate: string;
  daysOverdue: number;
  owner: string;
}
