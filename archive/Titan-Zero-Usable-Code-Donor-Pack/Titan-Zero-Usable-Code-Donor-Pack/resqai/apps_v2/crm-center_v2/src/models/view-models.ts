import type { HealthStatus, FollowupStatus, FollowupPriority, RiskLevel, TaskStatus, TaskPriority, FeedbackCategory, FeedbackSentiment, OpportunityStage, OpportunityType, SatisfactionScore, InteractionChannel, InteractionDirection, NoteCategory } from './dto';
import type { AccountDTO, FollowupDTO, RiskSignalDTO, InteractionDTO, NoteDTO, TaskDTO, FeedbackDTO, SatisfactionDTO, OpportunityDTO, CustomerDTO } from './dto';

export interface AccountDashboardVM {
  totalAccounts: number;
  healthDistribution: { healthy: number; watch: number; slipping: number; critical: number };
  averageHealthScore: number;
  criticalAccounts: number;
  slippingAccounts: number;
  healthyAccounts: number;
  watchAccounts: number;
  recentRiskSignals: RiskSignalVM[];
  overdueFollowups: number;
  lastScanDate?: string;
  upcomingAppointments: number;
  openTasks: number;
  pendingRenewals: number;
  satisfactionRate: number;
}

export interface AccountListItemVM {
  id: string;
  name: string;
  industry: string;
  healthStatus: HealthStatus;
  healthScore: number;
  owner: string;
  openTickets: number;
  riskLevel: RiskLevel;
  nextFollowupDate?: string;
  lastScanDate?: string;
  email: string;
}

export interface AccountDetailVM {
  id: string;
  name: string;
  industry: string;
  healthStatus: HealthStatus;
  healthScore: number;
  owner: string;
  email: string;
  phone: string;
  website?: string;
  address?: string;
  tags: string[];
  totalRevenue: number;
  openTickets: number;
  riskLevel?: RiskLevel;
  lastScanDate?: string;
  createdAt: string;
  contacts: AccountContactVM[];
  recentActivity: TimelineEventVM[];
  healthHistory?: HealthScorePoint[];
}

export interface HealthScorePoint {
  date: string;
  score: number;
}

export interface AccountContactVM {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  isPrimary: boolean;
}

export interface FollowupListItemVM {
  id: string;
  accountName: string;
  customerName: string;
  type: string;
  subject: string;
  priority: FollowupPriority;
  status: FollowupStatus;
  dueDate: string;
  ownerName: string;
  daysOverdue?: number;
}

export interface HealthScanResultVM {
  id: string;
  scanDate: string;
  accountsScanned: number;
  criticalCount: number;
  slippingCount: number;
  triggeredBy: string;
  status: 'completed' | 'running' | 'failed';
}

export interface RiskSignalVM {
  id: string;
  accountId: string;
  accountName: string;
  type: string;
  severity: RiskLevel;
  description: string;
  detectedAt: string;
  acknowledged: boolean;
  category?: string;
  level?: RiskLevel;
}

export interface TimelineEventVM {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  actor: string;
}

export interface InteractionVM {
  id: string;
  accountName: string;
  customerName: string;
  channel: InteractionChannel;
  direction: InteractionDirection;
  subject: string;
  summary: string;
  duration?: number;
  agentName: string;
  createdAt: string;
}

export interface NoteVM {
  id: string;
  category: NoteCategory;
  title: string;
  content: string;
  authorName: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskVM {
  id: string;
  accountName: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  assigneeName: string;
  relatedEntityType?: string;
  createdAt: string;
}

export interface FeedbackVM {
  id: string;
  customerName: string;
  accountName: string;
  category: FeedbackCategory;
  sentiment: FeedbackSentiment;
  rating: number;
  subject: string;
  source: string;
  acknowledged: boolean;
  createdAt: string;
}

export interface SatisfactionVM {
  id: string;
  customerName: string;
  accountName: string;
  overallScore: number;
  serviceScore?: number;
  responseTimeScore?: number;
  resolutionScore?: number;
  surveySource: string;
  respondedAt: string;
}

export interface OpportunityVM {
  id: string;
  customerName: string;
  accountName: string;
  type: OpportunityType;
  stage: OpportunityStage;
  title: string;
  value: number;
  probability: number;
  expectedCloseDate?: string;
  ownerName: string;
  createdAt: string;
}

export interface CRMDashboardVM {
  totalCustomers: number;
  activeAccounts: number;
  atRiskAccounts: number;
  overdueFollowups: number;
  openTasks: number;
  pendingRenewals: number;
  satisfactionRate: number;
  totalOpportunityValue: number;
  recentInteractions: InteractionVM[];
  pendingFollowups: FollowupDTO[];
  recentFeedback: FeedbackVM[];
  upcomingRenewals: OpportunityVM[];
  healthDistribution: { healthy: number; watch: number; slipping: number; critical: number };
}

export interface CustomerProfileVM {
  customer: CustomerDTO;
  account: AccountDTO | null;
  recentInteractions: InteractionVM[];
  recentNotes: NoteVM[];
  openTasks: TaskVM[];
  feedbackHistory: FeedbackVM[];
  satisfactionTrend: SatisfactionVM[];
  activeOpportunities: OpportunityVM[];
}

export interface RetentionDashboardVM {
  totalAtRisk: number;
  recoveredThisMonth: number;
  churnRate: number;
  retentionRate: number;
  avgCustomerLifetime: number;
  atRiskByReason: { reason: string; count: number }[];
  healthTrend: { period: string; healthy: number; atRisk: number; churned: number }[];
}

export interface CommunicationCenterVM {
  recentCommunications: InteractionVM[];
  scheduledFollowups: FollowupDTO[];
  pendingOutreach: number;
  lastOutreachDate?: string;
  channelsBreakdown: { channel: string; count: number }[];
}
