import type { HealthStatus, FollowupStatus, FollowupPriority, RiskLevel, TaskStatus, TaskPriority, FeedbackCategory, FeedbackSentiment, OpportunityStage, OpportunityType, SatisfactionScore, InteractionChannel, InteractionDirection, NoteCategory } from './dto';
import type { AccountDTO, FollowupDTO, RiskSignalDTO, InteractionDTO, NoteDTO, TaskDTO, FeedbackDTO, SatisfactionDTO, OpportunityDTO, CustomerDTO } from './dto';

export interface HealthDistributionVM {
  healthy: number;
  warning: number;
  critical: number;
  unknown: number;
  total: number;
}

export interface AccountDashboardVM {
  totalAccounts: number;
  healthDistribution: HealthDistributionVM;
  averageHealthScore: number;
  recentRiskSignals: RiskSignalVM[];
  overdueFollowups: number;
  upcomingAppointments: number;
  criticalAccounts: number;
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
  lastScanDate: string | null;
  nextFollowupDate: string | null;
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
  website: string;
  address: string;
  createdAt: string;
  lastScanDate: string | null;
  openTickets: number;
  totalRevenue: number;
  riskLevel: RiskLevel;
  tags: string[];
  contacts: AccountContactVM[];
  recentActivity: TimelineEntryVM[];
  healthHistory: HealthScorePoint[];
}

export interface AccountContactVM {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isPrimary: boolean;
}

export interface HealthScorePoint {
  date: string;
  score: number;
}

export interface TimelineEntryVM {
  id: string;
  type: 'note' | 'ticket' | 'followup' | 'scan' | 'appointment' | 'dispute';
  title: string;
  description: string;
  timestamp: string;
  user: string;
}

export interface FollowupListItemVM {
  id: string;
  accountId: string;
  accountName: string;
  customerName: string;
  subject: string;
  priority: FollowupPriority;
  status: FollowupStatus;
  dueDate: string;
  owner: string;
  daysUntilDue: number;
  isOverdue: boolean;
}

export interface HealthScanResultVM {
  id: string;
  accountId: string;
  accountName: string;
  score: number;
  previousScore: number | null;
  status: HealthStatus;
  trigger: string;
  scannedAt: string;
  findingCount: number;
}

export interface RiskSignalVM {
  id: string;
  accountId: string;
  accountName: string;
  type: string;
  description: string;
  level: RiskLevel;
  category: string;
  acknowledged: boolean;
  detectedAt: string;
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
