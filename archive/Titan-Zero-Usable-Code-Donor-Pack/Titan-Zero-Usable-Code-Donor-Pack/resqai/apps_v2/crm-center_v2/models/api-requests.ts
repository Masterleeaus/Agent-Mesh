import type { FollowupPriority, TaskPriority, FeedbackCategory, OpportunityType, SatisfactionScore, InteractionChannel, InteractionDirection, NoteCategory, TaskStatus } from './dto';

export interface CreateFollowupRequest {
  accountId: string;
  customerId: string;
  type: string;
  subject: string;
  description?: string;
  priority: string;
  dueDate: string;
  owner: string;
  notes?: string;
}

export interface UpdateFollowupRequest {
  subject?: string;
  description?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  owner?: string;
  notes?: string;
}

export interface RunHealthScanRequest {
  accountId: string;
  trigger?: string;
}

export interface AddAccountNoteRequest {
  accountId: string;
  note: string;
}

export interface BulkAccountActionRequest {
  accountIds: string[];
  action: string;
}

export interface AccountFilterRequest {
  search?: string;
  healthStatus?: string[];
  riskLevel?: string[];
  owner?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FollowupFilterRequest {
  status?: string[];
  priority?: string[];
  ownerId?: string;
  overdue?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateInteractionRequest {
  accountId: string;
  customerId: string;
  channel: InteractionChannel;
  direction: InteractionDirection;
  subject: string;
  summary: string;
  duration?: number;
  agentId?: string;
}

export interface CreateNoteRequest {
  accountId: string;
  customerId?: string;
  category: NoteCategory;
  title: string;
  content: string;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  category?: NoteCategory;
  pinned?: boolean;
}

export interface CreateTaskRequest {
  accountId: string;
  customerId?: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate?: string;
  assigneeId: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  assigneeId?: string;
  completedDate?: string;
}

export interface RecordFeedbackRequest {
  accountId: string;
  customerId: string;
  category: FeedbackCategory;
  sentiment: 'positive' | 'neutral' | 'negative';
  rating: SatisfactionScore;
  subject: string;
  description: string;
  source: string;
}

export interface CreateOpportunityRequest {
  accountId: string;
  customerId: string;
  type: OpportunityType;
  title: string;
  description: string;
  value: number;
  probability: number;
  expectedCloseDate?: string;
  ownerId: string;
  source?: string;
}

export interface UpdateOpportunityRequest {
  stage?: string;
  value?: number;
  probability?: number;
  expectedCloseDate?: string;
  notes?: string;
  ownerId?: string;
}

export interface RecordSatisfactionRequest {
  accountId: string;
  customerId: string;
  overallScore: SatisfactionScore;
  serviceScore?: SatisfactionScore;
  responseTimeScore?: SatisfactionScore;
  resolutionScore?: SatisfactionScore;
  comments?: string;
  surveySource: string;
}

export interface ScheduleCallRequest {
  accountId: string;
  customerId: string;
  subject: string;
  scheduledDate: string;
  duration: number;
  notes?: string;
  ownerId: string;
}

export interface CloseFollowupRequest {
  completedDate: string;
  notes?: string;
  outcome?: string;
}

export interface CustomerMergeRequest {
  primaryCustomerId: string;
  secondaryCustomerId: string;
  fields?: string[];
}

export interface SearchRequest {
  query: string;
  entityTypes?: string[];
  page?: number;
  pageSize?: number;
}

export interface CustomerFilterRequest {
  search?: string;
  status?: string[];
  health?: string[];
  tags?: string[];
  page?: number;
  pageSize?: number;
}
