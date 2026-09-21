export enum HealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown'
}

export enum FollowupStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  WAITING = 'waiting',
  CANCELLED = 'cancelled'
}

export enum FollowupPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ScanTrigger {
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  EVENT = 'event',
  API = 'api'
}

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
  name: string;
  industry: string;
  healthStatus: HealthStatus;
  healthScore: number;
  owner: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  lastScanDate: string | null;
  nextFollowupDate: string | null;
  openTickets: number;
  totalRevenue: number;
  riskLevel: RiskLevel;
  tags: string[];
}

export interface CustomerDTO {
  id: string;
  accountId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface FollowupDTO {
  id: string;
  accountId: string;
  accountName: string;
  customerId: string;
  customerName: string;
  type: string;
  subject: string;
  description: string;
  priority: FollowupPriority;
  status: FollowupStatus;
  dueDate: string;
  completedDate: string | null;
  owner: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthScanDTO {
  id: string;
  accountId: string;
  accountName: string;
  score: number;
  previousScore: number | null;
  status: HealthStatus;
  trigger: ScanTrigger;
  summary: string;
  findings: HealthScanFinding[];
  scannedAt: string;
  createdAt: string;
}

export interface HealthScanFinding {
  category: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendation: string;
}

export interface RiskSignalDTO {
  id: string;
  accountId: string;
  accountName: string;
  type: string;
  description: string;
  level: RiskLevel;
  category: string;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  detectedAt: string;
  expiresAt: string | null;
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
