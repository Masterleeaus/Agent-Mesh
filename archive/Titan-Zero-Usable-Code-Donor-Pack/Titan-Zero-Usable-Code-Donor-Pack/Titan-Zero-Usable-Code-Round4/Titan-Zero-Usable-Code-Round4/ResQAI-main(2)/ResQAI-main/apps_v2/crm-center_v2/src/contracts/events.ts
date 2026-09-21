export const CRM_EVENTS = {
  ACCOUNT_HEALTH_SCAN_COMPLETED: 'account.health.scan.completed',
  ACCOUNT_HEALTH_CHANGED: 'account.health.changed',
  FOLLOWUP_CREATED: 'followup.created',
  FOLLOWUP_UPDATED: 'followup.updated',
  FOLLOWUP_COMPLETED: 'followup.completed',
  FOLLOWUP_SLIPPAGE_DETECTED: 'followup.slippage.detected',
  INTERACTION_CREATED: 'interaction.created',
  NOTE_CREATED: 'note.created',
  NOTE_UPDATED: 'note.updated',
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_COMPLETED: 'task.completed',
  FEEDBACK_RECORDED: 'feedback.recorded',
  SATISFACTION_RECORDED: 'satisfaction.recorded',
  OPPORTUNITY_CREATED: 'opportunity.created',
  OPPORTUNITY_STAGE_CHANGED: 'opportunity.stage.changed',
  OPPORTUNITY_WON: 'opportunity.won',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_MERGED: 'customer.merged',
  RETENTION_ALERT: 'retention.alert',
} as const;

export interface AccountHealthScanCompletedPayload {
  scanId: string;
  accountsScanned: number;
  criticalCount: number;
  slippingCount: number;
}

export interface AccountHealthChangedPayload {
  accountId: string;
  customerId: string;
  oldHealth: string;
  newHealth: string;
  healthScore: number;
}

export interface FollowupCreatedPayload {
  followupId: string;
  accountId: string;
  type: string;
  priority: string;
  dueDate: string;
  owner: string;
}

export interface FollowupSlippageDetectedPayload {
  followupId: string;
  accountId: string;
  daysOverdue: number;
}

export interface InteractionCreatedPayload {
  interactionId: string;
  accountId: string;
  channel: string;
  direction: string;
}

export interface TaskCreatedPayload {
  taskId: string;
  accountId: string;
  title: string;
  priority: string;
  assignee: string;
}

export interface FeedbackRecordedPayload {
  feedbackId: string;
  accountId: string;
  category: string;
  sentiment: string;
  rating: number;
}

export interface OpportunityStageChangedPayload {
  opportunityId: string;
  accountId: string;
  type: string;
  oldStage: string;
  newStage: string;
}

export interface CustomerMergedPayload {
  primaryCustomerId: string;
  secondaryCustomerId: string;
  mergedFields: string[];
}
