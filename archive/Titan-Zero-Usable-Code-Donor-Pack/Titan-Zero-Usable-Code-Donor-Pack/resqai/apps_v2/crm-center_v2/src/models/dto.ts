export type HealthStatus = 'healthy' | 'watch' | 'slipping' | 'critical';
export type FollowupStatus = 'open' | 'in_progress' | 'completed' | 'overdue' | 'waiting' | 'cancelled';
export type FollowupPriority = 'low' | 'medium' | 'high' | 'urgent';
export type RiskLevel = 'info' | 'warning' | 'critical';
export type ScanTrigger = 'manual' | 'scheduled' | 'automated';

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type FeedbackCategory = 'service' | 'support' | 'product' | 'billing' | 'general';
export type FeedbackSentiment = 'positive' | 'neutral' | 'negative';
export type OpportunityStage = 'identified' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type OpportunityType = 'renewal' | 'upsell' | 'cross_sell' | 'new_business';
export type SatisfactionScore = 1 | 2 | 3 | 4 | 5;
export type InteractionChannel = 'phone' | 'email' | 'chat' | 'portal' | 'in_person' | 'social';
export type InteractionDirection = 'inbound' | 'outbound';
export type NoteCategory = 'general' | 'account' | 'support' | 'billing' | 'meeting';

export interface AccountDTO {
  id: string;
  customerId: string;
  customerName: string;
  email: string;
  phone: string;
  health: HealthStatus;
  healthScore: number;
  lastScanDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDTO {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  accountId?: string;
  accountName?: string;
  address?: string;
  tags?: string[];
  lifetimeValue?: number;
  lastContactDate?: string;
  createdAt: string;
}

export interface FollowupDTO {
  id: string;
  accountId: string;
  customerId: string;
  type: string;
  subject: string;
  description: string;
  priority: FollowupPriority;
  status: FollowupStatus;
  dueDate: string;
  completedDate?: string;
  ownerId: string;
  ownerName: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthScanDTO {
  id: string;
  scanDate: string;
  accountsScanned: number;
  criticalCount: number;
  slippingCount: number;
  watchCount: number;
  healthyCount: number;
  triggeredBy: ScanTrigger;
  triggerReason?: string;
  completedAt: string;
}

export interface RiskSignalDTO {
  id: string;
  accountId: string;
  customerName: string;
  type: string;
  severity: RiskLevel;
  description: string;
  detectedAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface InteractionDTO {
  id: string;
  accountId: string;
  customerId: string;
  customerName: string;
  channel: InteractionChannel;
  direction: InteractionDirection;
  subject: string;
  summary: string;
  duration?: number;
  agentId: string;
  agentName: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
}

export interface NoteDTO {
  id: string;
  accountId: string;
  customerId: string;
  category: NoteCategory;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDTO {
  id: string;
  accountId: string;
  customerId?: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  completedDate?: string;
  assigneeId: string;
  assigneeName: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackDTO {
  id: string;
  accountId: string;
  customerId: string;
  customerName: string;
  category: FeedbackCategory;
  sentiment: FeedbackSentiment;
  rating: SatisfactionScore;
  subject: string;
  description: string;
  source: string;
  acknowledged: boolean;
  createdAt: string;
}

export interface SatisfactionDTO {
  id: string;
  accountId: string;
  customerId: string;
  customerName: string;
  overallScore: SatisfactionScore;
  serviceScore?: SatisfactionScore;
  responseTimeScore?: SatisfactionScore;
  resolutionScore?: SatisfactionScore;
  comments?: string;
  surveySource: string;
  respondedAt: string;
}

export interface OpportunityDTO {
  id: string;
  accountId: string;
  customerId: string;
  customerName: string;
  type: OpportunityType;
  stage: OpportunityStage;
  title: string;
  description: string;
  value: number;
  probability: number;
  expectedCloseDate?: string;
  ownerId: string;
  ownerName: string;
  source?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
