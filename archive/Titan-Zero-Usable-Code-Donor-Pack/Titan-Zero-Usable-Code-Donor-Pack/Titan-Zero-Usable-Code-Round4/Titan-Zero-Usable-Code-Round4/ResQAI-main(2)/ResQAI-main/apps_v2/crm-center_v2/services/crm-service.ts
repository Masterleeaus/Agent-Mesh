import type {
  AccountDashboardResponse, AccountListResponse, AccountDetailResponse,
  FollowupListResponse, HealthScanListResponse, RiskSignalListResponse,
  InteractionListResponse, NoteListResponse, CreateNoteResponse,
  TaskListResponse, CreateTaskResponse, FeedbackListResponse, CreateFeedbackResponse,
  SatisfactionListResponse, OpportunityListResponse, CreateOpportunityResponse,
  CRMDashboardResponse, CustomerProfileResponse, RetentionDashboardResponse,
  CommunicationCenterResponse, CustomerListResponse, SearchResponse,
} from '../models/api-responses';
import type {
  CreateFollowupRequest, UpdateFollowupRequest, AccountFilterRequest,
  CreateInteractionRequest, CreateNoteRequest, UpdateNoteRequest,
  CreateTaskRequest, UpdateTaskRequest, RecordFeedbackRequest,
  CreateOpportunityRequest, UpdateOpportunityRequest, RecordSatisfactionRequest,
  ScheduleCallRequest, CloseFollowupRequest, CustomerMergeRequest, SearchRequest,
  CustomerFilterRequest,
} from '../models/api-requests';
import type { AccountDTO, FollowupDTO, HealthScanDTO, RiskSignalDTO, InteractionDTO, NoteDTO, TaskDTO, FeedbackDTO, SatisfactionDTO, OpportunityDTO, CustomerDTO } from '../models/dto';
import {
  mockAccounts, mockCustomers, mockFollowups, mockHealthScans, mockRiskSignals,
  mockInteractions, mockNotes, mockTasks, mockFeedback, mockSatisfaction,
  mockOpportunities, contactsByAccount, timelineByAccount,
} from './mock-data';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function paginate<T>(items: T[], page = 1, pageSize = 20): { data: T[]; total: number; page: number; pageSize: number } {
  const start = (page - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), total: items.length, page, pageSize };
}

function filterAccounts(items: AccountDTO[], filter?: AccountFilterRequest): AccountDTO[] {
  if (!filter) return items;
  let filtered = [...items];
  if (filter.search) {
    const q = filter.search.toLowerCase();
    filtered = filtered.filter(a => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.owner.toLowerCase().includes(q));
  }
  if (filter.healthStatus && filter.healthStatus.length > 0) filtered = filtered.filter(a => filter.healthStatus!.includes(a.healthStatus));
  if (filter.riskLevel && filter.riskLevel.length > 0) filtered = filtered.filter(a => filter.riskLevel!.includes(a.riskLevel));
  if (filter.owner) filtered = filtered.filter(a => a.owner === filter.owner);
  return filtered;
}

function filterFollowups(items: FollowupDTO[], filter?: { accountId?: string; status?: string; priority?: string; overdue?: boolean; page?: number; pageSize?: number }): FollowupDTO[] {
  if (!filter) return items;
  let filtered = [...items];
  if (filter.accountId) filtered = filtered.filter(f => f.accountId === filter.accountId);
  if (filter.status) {
    const statuses = filter.status.split(',');
    filtered = filtered.filter(f => statuses.includes(f.status));
  }
  if (filter.priority) {
    const priorities = filter.priority.split(',');
    filtered = filtered.filter(f => priorities.includes(f.priority));
  }
  if (filter.overdue) filtered = filtered.filter(f => f.status === 'overdue');
  return filtered;
}

export async function getDashboard(): Promise<AccountDashboardResponse> {
  await delay(300);
  const totalAccounts = mockAccounts.length;
  const healthDistribution = { healthy: 0, warning: 0, critical: 0, unknown: 0, total: totalAccounts };
  let totalScore = 0;
  mockAccounts.forEach(a => {
    if (a.healthStatus in healthDistribution) healthDistribution[a.healthStatus as keyof typeof healthDistribution]++;
    totalScore += a.healthScore;
  });
  const overdueFollowups = mockFollowups.filter(f => f.status === 'overdue').length;
  const data = {
    totalAccounts,
    healthDistribution,
    averageHealthScore: Math.round(totalScore / totalAccounts),
    recentRiskSignals: mockRiskSignals.slice(0, 5).map(r => ({
      id: r.id, accountId: r.accountId, accountName: r.accountName, type: r.type,
      description: r.description, level: r.level, category: r.category,
      acknowledged: r.acknowledged, detectedAt: r.detectedAt,
    })),
    overdueFollowups,
    upcomingAppointments: 3,
    criticalAccounts: mockAccounts.filter(a => a.healthStatus === 'critical').length,
  };
  return { data };
}

export async function getCRMDashboard(): Promise<CRMDashboardResponse> {
  await delay(300);
  const totalOpportunityValue = mockOpportunities.reduce((s, o) => s + o.value, 0);
  const healthDistribution = { healthy: 0, watch: 0, slipping: 0, critical: 0 };
  mockAccounts.forEach(a => {
    if (a.healthStatus === 'healthy') healthDistribution.healthy++;
    else if (a.healthStatus === 'warning') healthDistribution.watch++;
    else if (a.healthStatus === 'critical') healthDistribution.critical++;
    else healthDistribution.slipping++;
  });
  const data = {
    totalCustomers: mockCustomers.length,
    activeAccounts: mockAccounts.length,
    atRiskAccounts: mockAccounts.filter(a => a.healthStatus === 'critical' || a.healthStatus === 'warning').length,
    overdueFollowups: mockFollowups.filter(f => f.status === 'overdue').length,
    openTasks: mockTasks.filter(t => t.status === 'open' || t.status === 'in_progress').length,
    pendingRenewals: mockOpportunities.filter(o => o.type === 'renewal' && o.stage !== 'won' && o.stage !== 'lost').length,
    satisfactionRate: 72,
    totalOpportunityValue,
    recentInteractions: mockInteractions.slice(0, 5).map(i => ({
      id: i.id, accountName: mockAccounts.find(a => a.id === i.accountId)?.name || '', customerName: i.customerName,
      channel: i.channel, direction: i.direction, subject: i.subject, summary: i.summary,
      duration: i.duration, agentName: i.agentName, createdAt: i.createdAt,
    })),
    pendingFollowups: mockFollowups.filter(f => f.status === 'overdue' || f.status === 'due'),
    recentFeedback: mockFeedback.slice(0, 5).map(f => ({
      id: f.id, customerName: f.customerName, accountName: f.accountName,
      category: f.category, sentiment: f.sentiment, rating: f.rating, subject: f.subject,
      source: f.source, acknowledged: f.acknowledged, createdAt: f.createdAt,
    })),
    upcomingRenewals: mockOpportunities.filter(o => o.type === 'renewal' && o.stage !== 'won' && o.stage !== 'lost').map(o => ({
      id: o.id, customerName: o.customerName, accountName: o.accountName, type: o.type,
      stage: o.stage, title: o.title, value: o.value, probability: o.probability,
      expectedCloseDate: o.expectedCloseDate, ownerName: o.ownerName, createdAt: o.createdAt,
    })),
    healthDistribution,
  };
  return { data };
}

export async function listAccounts(filter?: AccountFilterRequest): Promise<AccountListResponse> {
  await delay(300);
  const filtered = filterAccounts(mockAccounts, filter);
  const paged = paginate(filtered, filter?.page, filter?.pageSize);
  return {
    data: paged.data.map(a => ({
      id: a.id, name: a.name, industry: a.industry, healthStatus: a.healthStatus,
      healthScore: a.healthScore, owner: a.owner, openTickets: a.openTickets,
      riskLevel: a.riskLevel, lastScanDate: a.lastScanDate, nextFollowupDate: a.nextFollowupDate,
    })),
    total: paged.total, page: paged.page, pageSize: paged.pageSize,
  };
}

export async function getAccount(id: string): Promise<AccountDetailResponse> {
  await delay(200);
  const account = mockAccounts.find(a => a.id === id);
  if (!account) throw new Error(`Account ${id} not found`);
  const contacts = contactsByAccount[id] || [];
  const recentActivity = timelineByAccount[id] || [];
  const data = {
    id: account.id, name: account.name, industry: account.industry,
    healthStatus: account.healthStatus, healthScore: account.healthScore,
    owner: account.owner, email: account.email, phone: account.phone,
    website: account.website, address: account.address,
    createdAt: account.createdAt, lastScanDate: account.lastScanDate,
    openTickets: account.openTickets, totalRevenue: account.totalRevenue,
    riskLevel: account.riskLevel, tags: account.tags,
    contacts, recentActivity,
    healthHistory: [
      { date: daysAgo(30), score: account.healthScore + 5 },
      { date: daysAgo(20), score: account.healthScore + 3 },
      { date: daysAgo(10), score: account.healthScore + 1 },
      { date: daysAgo(0), score: account.healthScore },
    ],
  };
  return { data };
}

export async function updateAccount(id: string, _data: Partial<AccountDTO>): Promise<void> {
  await delay(200);
  const account = mockAccounts.find(a => a.id === id);
  if (account) Object.assign(account, _data);
}

export async function listCustomers(filter?: CustomerFilterRequest): Promise<CustomerListResponse> {
  await delay(300);
  let filtered = [...mockCustomers];
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }
  const paged = paginate(filtered, filter?.page, filter?.pageSize);
  return { data: paged.data, total: paged.total, page: paged.page, pageSize: paged.pageSize };
}

export async function getCustomer(id: string): Promise<CustomerProfileResponse> {
  await delay(200);
  const customer = mockCustomers.find(c => c.id === id);
  if (!customer) throw new Error(`Customer ${id} not found`);
  const account = mockAccounts.find(a => a.id === customer.accountId) || null;
  const data = {
    customer,
    account,
    recentInteractions: mockInteractions.filter(i => i.customerId === id).map(i => ({
      id: i.id, accountName: mockAccounts.find(a => a.id === i.accountId)?.name || '',
      customerName: i.customerName, channel: i.channel, direction: i.direction,
      subject: i.subject, summary: i.summary, duration: i.duration,
      agentName: i.agentName, createdAt: i.createdAt,
    })),
    recentNotes: mockNotes.filter(n => n.customerId === id).map(n => ({
      id: n.id, category: n.category, title: n.title, content: n.content,
      authorName: n.authorName, pinned: n.pinned, createdAt: n.createdAt, updatedAt: n.updatedAt,
    })),
    openTasks: mockTasks.filter(t => t.customerId === id && t.status !== 'completed').map(t => ({
      id: t.id, accountName: mockAccounts.find(a => a.id === t.accountId)?.name || '',
      title: t.title, description: t.description, priority: t.priority, status: t.status,
      dueDate: t.dueDate, assigneeName: t.assigneeName,
      relatedEntityType: t.relatedEntityType, createdAt: t.createdAt,
    })),
    feedbackHistory: mockFeedback.filter(f => f.customerId === id).map(f => ({
      id: f.id, customerName: f.customerName, accountName: f.accountName,
      category: f.category, sentiment: f.sentiment, rating: f.rating, subject: f.subject,
      source: f.source, acknowledged: f.acknowledged, createdAt: f.createdAt,
    })),
    satisfactionTrend: mockSatisfaction.filter(s => s.customerId === id),
    activeOpportunities: mockOpportunities.filter(o => o.customerId === id && o.stage !== 'won' && o.stage !== 'lost').map(o => ({
      id: o.id, customerName: o.customerName, accountName: o.accountName, type: o.type,
      stage: o.stage, title: o.title, value: o.value, probability: o.probability,
      expectedCloseDate: o.expectedCloseDate, ownerName: o.ownerName, createdAt: o.createdAt,
    })),
  };
  return { data };
}

export async function updateCustomer(id: string, _data: Partial<CustomerDTO>): Promise<void> {
  await delay(200);
  const customer = mockCustomers.find(c => c.id === id);
  if (customer) Object.assign(customer, _data);
}

export async function mergeCustomers(_request: CustomerMergeRequest): Promise<void> {
  await delay(500);
}

export async function listFollowups(filter?: {
  accountId?: string; status?: string; priority?: string;
  overdue?: boolean; page?: number; pageSize?: number;
}): Promise<FollowupListResponse> {
  await delay(300);
  const filtered = filterFollowups(mockFollowups, filter);
  const paged = paginate(filtered, filter?.page, filter?.pageSize);
  return {
    data: paged.data.map(f => ({
      id: f.id, accountId: f.accountId, accountName: f.accountName,
      customerName: f.customerName, subject: f.subject, priority: f.priority,
      status: f.status, dueDate: f.dueDate, owner: f.owner,
      daysUntilDue: Math.round((new Date(f.dueDate).getTime() - Date.now()) / 86400000),
      isOverdue: f.status === 'overdue',
    })),
    total: paged.total, page: paged.page, pageSize: paged.pageSize,
  };
}

export async function getFollowup(id: string): Promise<{ data: FollowupDTO }> {
  await delay(200);
  const followup = mockFollowups.find(f => f.id === id);
  if (!followup) throw new Error(`Followup ${id} not found`);
  return { data: followup };
}

export async function createFollowup(_request: CreateFollowupRequest): Promise<{ data: FollowupDTO }> {
  await delay(400);
  const newFollowup: FollowupDTO = {
    id: `flw-${String(mockFollowups.length + 1).padStart(3, '0')}`,
    accountId: _request.accountId,
    accountName: mockAccounts.find(a => a.id === _request.accountId)?.name || '',
    customerId: _request.customerId,
    customerName: mockCustomers.find(c => c.id === _request.customerId)?.name || '',
    type: _request.type, subject: _request.subject, description: _request.description || '',
    priority: _request.priority as FollowupDTO['priority'],
    status: 'open', dueDate: _request.dueDate, completedDate: null,
    owner: _request.owner, notes: _request.notes || '',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  mockFollowups.push(newFollowup);
  return { data: newFollowup };
}

export async function updateFollowup(id: string, _request: UpdateFollowupRequest): Promise<void> {
  await delay(200);
  const followup = mockFollowups.find(f => f.id === id);
  if (followup) {
    Object.assign(followup, _request, { updatedAt: new Date().toISOString() });
  }
}

export async function closeFollowup(id: string, _request: CloseFollowupRequest): Promise<void> {
  await delay(200);
  const followup = mockFollowups.find(f => f.id === id);
  if (followup) {
    followup.status = 'completed';
    followup.completedDate = _request.completedDate;
    followup.notes = _request.notes || followup.notes;
    followup.updatedAt = new Date().toISOString();
  }
}

export async function listHealthScans(accountId?: string): Promise<HealthScanListResponse> {
  await delay(300);
  let filtered = [...mockHealthScans];
  if (accountId) filtered = filtered.filter(s => s.accountId === accountId);
  return {
    data: filtered.map(s => ({
      id: s.id, accountId: s.accountId, accountName: s.accountName,
      score: s.score, previousScore: s.previousScore, status: s.status,
      trigger: s.trigger, scannedAt: s.scannedAt, findingCount: s.findings.length,
    })),
    total: filtered.length,
  };
}

export async function runHealthScan(accountId: string): Promise<{ data: HealthScanDTO }> {
  await delay(800);
  const account = mockAccounts.find(a => a.id === accountId);
  const score = account ? Math.min(100, Math.max(10, (account.healthScore || 70) + Math.floor(Math.random() * 20 - 10))) : 50;
  const scan: HealthScanDTO = {
    id: `scan-${String(mockHealthScans.length + 1).padStart(3, '0')}`,
    accountId, accountName: account?.name || 'Unknown',
    score, previousScore: account?.healthScore || null,
    status: score >= 80 ? 'healthy' : score >= 50 ? 'warning' : 'critical',
    trigger: 'manual', summary: `Health scan completed with score ${score}`,
    findings: score < 80 ? [{ category: 'general', severity: score < 50 ? 'high' : 'medium', message: 'Health score below threshold', recommendation: 'Review account health' }] : [],
    scannedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
  };
  mockHealthScans.push(scan);
  if (account) account.healthScore = score;
  return { data: scan };
}

export async function listRiskSignals(params?: {
  accountId?: string; level?: string; acknowledged?: boolean;
}): Promise<RiskSignalListResponse> {
  await delay(300);
  let filtered = [...mockRiskSignals];
  if (params?.accountId) filtered = filtered.filter(r => r.accountId === params.accountId);
  if (params?.level) filtered = filtered.filter(r => r.level === params.level);
  if (params?.acknowledged !== undefined) filtered = filtered.filter(r => r.acknowledged === params.acknowledged);
  return {
    data: filtered.map(r => ({
      id: r.id, accountId: r.accountId, accountName: r.accountName, type: r.type,
      description: r.description, level: r.level, category: r.category,
      acknowledged: r.acknowledged, detectedAt: r.detectedAt,
    })),
    total: filtered.length,
  };
}

export async function listInteractions(filter?: {
  accountId?: string; customerId?: string; channel?: string;
  page?: number; pageSize?: number;
}): Promise<InteractionListResponse> {
  await delay(300);
  let filtered = [...mockInteractions];
  if (filter?.accountId) filtered = filtered.filter(i => i.accountId === filter.accountId);
  if (filter?.customerId) filtered = filtered.filter(i => i.customerId === filter.customerId);
  if (filter?.channel) filtered = filtered.filter(i => i.channel === filter.channel);
  const paged = paginate(filtered, filter?.page, filter?.pageSize);
  return {
    data: paged.data.map(i => ({
      id: i.id, accountName: mockAccounts.find(a => a.id === i.accountId)?.name || '',
      customerName: i.customerName, channel: i.channel, direction: i.direction,
      subject: i.subject, summary: i.summary, duration: i.duration,
      agentName: i.agentName, createdAt: i.createdAt,
    })),
    total: paged.total, page: paged.page, pageSize: paged.pageSize,
  };
}

export async function createInteraction(_request: CreateInteractionRequest): Promise<{ data: InteractionDTO }> {
  await delay(300);
  const interaction: InteractionDTO = {
    id: `int-${String(mockInteractions.length + 1).padStart(3, '0')}`,
    accountId: _request.accountId,
    customerId: _request.customerId,
    customerName: mockCustomers.find(c => c.id === _request.customerId)?.name || '',
    channel: _request.channel, direction: _request.direction,
    subject: _request.subject, summary: _request.summary,
    duration: _request.duration,
    agentId: _request.agentId || 'agent-001',
    agentName: 'Current User',
    createdAt: new Date().toISOString(),
  };
  mockInteractions.push(interaction);
  return { data: interaction };
}

export async function listNotes(accountId?: string): Promise<NoteListResponse> {
  await delay(200);
  let filtered = [...mockNotes];
  if (accountId) filtered = filtered.filter(n => n.accountId === accountId);
  return {
    data: filtered.map(n => ({
      id: n.id, category: n.category, title: n.title, content: n.content,
      authorName: n.authorName, pinned: n.pinned, createdAt: n.createdAt, updatedAt: n.updatedAt,
    })),
    total: filtered.length,
  };
}

export async function createNote(_request: CreateNoteRequest): Promise<CreateNoteResponse> {
  await delay(300);
  const note: NoteDTO = {
    id: `note-${String(mockNotes.length + 1).padStart(3, '0')}`,
    accountId: _request.accountId,
    customerId: _request.customerId || null as unknown as string,
    category: _request.category, title: _request.title, content: _request.content,
    authorId: 'user-001', authorName: 'Current User', pinned: false,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  mockNotes.push(note);
  return { data: note };
}

export async function updateNote(id: string, _request: UpdateNoteRequest): Promise<void> {
  await delay(200);
  const note = mockNotes.find(n => n.id === id);
  if (note) Object.assign(note, _request, { updatedAt: new Date().toISOString() });
}

export async function listTasks(filter?: {
  accountId?: string; status?: string; priority?: string;
  assigneeId?: string; page?: number; pageSize?: number;
}): Promise<TaskListResponse> {
  await delay(300);
  let filtered = [...mockTasks];
  if (filter?.accountId) filtered = filtered.filter(t => t.accountId === filter.accountId);
  if (filter?.status) {
    const statuses = filter.status.split(',');
    filtered = filtered.filter(t => statuses.includes(t.status));
  }
  if (filter?.priority) {
    const priorities = filter.priority.split(',');
    filtered = filtered.filter(t => priorities.includes(t.priority));
  }
  if (filter?.assigneeId) filtered = filtered.filter(t => t.assigneeId === filter.assigneeId);
  const paged = paginate(filtered, filter?.page, filter?.pageSize);
  return {
    data: paged.data.map(t => ({
      id: t.id, accountName: mockAccounts.find(a => a.id === t.accountId)?.name || '',
      title: t.title, description: t.description, priority: t.priority, status: t.status,
      dueDate: t.dueDate, assigneeName: t.assigneeName,
      relatedEntityType: t.relatedEntityType, createdAt: t.createdAt,
    })),
    total: paged.total, page: paged.page, pageSize: paged.pageSize,
  };
}

export async function createTask(_request: CreateTaskRequest): Promise<CreateTaskResponse> {
  await delay(300);
  const task: TaskDTO = {
    id: `task-${String(mockTasks.length + 1).padStart(3, '0')}`,
    accountId: _request.accountId, customerId: _request.customerId || null as unknown as string,
    title: _request.title, description: _request.description,
    priority: _request.priority, status: 'open',
    dueDate: _request.dueDate,
    assigneeId: _request.assigneeId, assigneeName: 'Assignee',
    relatedEntityType: _request.relatedEntityType, relatedEntityId: _request.relatedEntityId,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  mockTasks.push(task);
  return { data: task };
}

export async function updateTask(id: string, _request: UpdateTaskRequest): Promise<void> {
  await delay(200);
  const task = mockTasks.find(t => t.id === id);
  if (task) Object.assign(task, _request, { updatedAt: new Date().toISOString() });
}

export async function listFeedback(filter?: {
  accountId?: string; customerId?: string; category?: string;
  sentiment?: string; page?: number; pageSize?: number;
}): Promise<FeedbackListResponse> {
  await delay(300);
  let filtered = [...mockFeedback];
  if (filter?.accountId) filtered = filtered.filter(f => f.accountId === filter.accountId);
  if (filter?.customerId) filtered = filtered.filter(f => f.customerId === filter.customerId);
  if (filter?.category) filtered = filtered.filter(f => f.category === filter.category);
  if (filter?.sentiment) filtered = filtered.filter(f => f.sentiment === filter.sentiment);
  const paged = paginate(filtered, filter?.page, filter?.pageSize);
  return {
    data: paged.data.map(f => ({
      id: f.id, customerName: f.customerName, accountName: f.accountName,
      category: f.category, sentiment: f.sentiment, rating: f.rating, subject: f.subject,
      source: f.source, acknowledged: f.acknowledged, createdAt: f.createdAt,
    })),
    total: paged.total, page: paged.page, pageSize: paged.pageSize,
  };
}

export async function recordFeedback(_request: RecordFeedbackRequest): Promise<CreateFeedbackResponse> {
  await delay(300);
  const feedback: FeedbackDTO = {
    id: `fb-${String(mockFeedback.length + 1).padStart(3, '0')}`,
    accountId: _request.accountId, customerId: _request.customerId,
    customerName: mockCustomers.find(c => c.id === _request.customerId)?.name || '',
    category: _request.category, sentiment: _request.sentiment,
    rating: _request.rating, subject: _request.subject,
    description: _request.description, source: _request.source,
    acknowledged: false, createdAt: new Date().toISOString(),
  };
  mockFeedback.push(feedback);
  return { data: feedback };
}

export async function listSatisfaction(accountId?: string): Promise<SatisfactionListResponse> {
  await delay(200);
  let filtered = [...mockSatisfaction];
  if (accountId) filtered = filtered.filter(s => s.accountId === accountId);
  return {
    data: filtered.map(s => ({
      id: s.id, customerName: s.customerName, accountName: s.accountName,
      overallScore: s.overallScore, serviceScore: s.serviceScore,
      responseTimeScore: s.responseTimeScore, resolutionScore: s.resolutionScore,
      surveySource: s.surveySource, respondedAt: s.respondedAt,
    })),
    total: filtered.length,
  };
}

export async function recordSatisfaction(_request: RecordSatisfactionRequest): Promise<{ data: SatisfactionDTO }> {
  await delay(300);
  const sat: SatisfactionDTO = {
    id: `sat-${String(mockSatisfaction.length + 1).padStart(3, '0')}`,
    accountId: _request.accountId, customerId: _request.customerId,
    customerName: mockCustomers.find(c => c.id === _request.customerId)?.name || '',
    overallScore: _request.overallScore, serviceScore: _request.serviceScore,
    responseTimeScore: _request.responseTimeScore, resolutionScore: _request.resolutionScore,
    comments: _request.comments, surveySource: _request.surveySource,
    respondedAt: new Date().toISOString(),
  };
  mockSatisfaction.push(sat);
  return { data: sat };
}

export async function listOpportunities(filter?: {
  accountId?: string; type?: string; stage?: string;
  page?: number; pageSize?: number;
}): Promise<OpportunityListResponse> {
  await delay(300);
  let filtered = [...mockOpportunities];
  if (filter?.accountId) filtered = filtered.filter(o => o.accountId === filter.accountId);
  if (filter?.type) filtered = filtered.filter(o => o.type === filter.type);
  if (filter?.stage) filtered = filtered.filter(o => o.stage === filter.stage);
  const paged = paginate(filtered, filter?.page, filter?.pageSize);
  return {
    data: paged.data.map(o => ({
      id: o.id, customerName: o.customerName, accountName: o.accountName,
      type: o.type, stage: o.stage, title: o.title, value: o.value,
      probability: o.probability, expectedCloseDate: o.expectedCloseDate,
      ownerName: o.ownerName, createdAt: o.createdAt,
    })),
    total: paged.total, page: paged.page, pageSize: paged.pageSize,
  };
}

export async function createOpportunity(_request: CreateOpportunityRequest): Promise<CreateOpportunityResponse> {
  await delay(300);
  const opp: OpportunityDTO = {
    id: `opp-${String(mockOpportunities.length + 1).padStart(3, '0')}`,
    accountId: _request.accountId, customerId: _request.customerId,
    customerName: mockCustomers.find(c => c.id === _request.customerId)?.name || '',
    type: _request.type, stage: 'identified', title: _request.title,
    description: _request.description, value: _request.value,
    probability: _request.probability, expectedCloseDate: _request.expectedCloseDate,
    ownerId: _request.ownerId, ownerName: 'Current User',
    source: _request.source, createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockOpportunities.push(opp);
  return { data: opp };
}

export async function updateOpportunity(id: string, _request: UpdateOpportunityRequest): Promise<void> {
  await delay(200);
  const opp = mockOpportunities.find(o => o.id === id);
  if (opp) Object.assign(opp, _request, { updatedAt: new Date().toISOString() });
}

export async function getRetentionDashboard(): Promise<RetentionDashboardResponse> {
  await delay(300);
  const atRisk = mockAccounts.filter(a => a.healthStatus === 'critical' || a.healthStatus === 'warning');
  const data = {
    totalAtRisk: atRisk.length,
    recoveredThisMonth: 2,
    churnRate: 8.5,
    retentionRate: 91.5,
    avgCustomerLifetime: 420,
    atRiskByReason: [
      { reason: 'Low satisfaction', count: atRisk.filter(a => a.healthScore < 40).length },
      { reason: 'High ticket volume', count: atRisk.filter(a => a.openTickets > 3).length },
      { reason: 'Payment issues', count: 2 },
      { reason: 'Contract expiring', count: 1 },
    ],
    healthTrend: [
      { period: 'Jan', healthy: 7, atRisk: 2, churned: 0 },
      { period: 'Feb', healthy: 6, atRisk: 3, churned: 1 },
      { period: 'Mar', healthy: 5, atRisk: 4, churned: 1 },
    ],
  };
  return { data };
}

export async function getCommunicationCenter(): Promise<CommunicationCenterResponse> {
  await delay(300);
  const data = {
    recentCommunications: mockInteractions.slice(0, 5).map(i => ({
      id: i.id, accountName: mockAccounts.find(a => a.id === i.accountId)?.name || '',
      customerName: i.customerName, channel: i.channel, direction: i.direction,
      subject: i.subject, summary: i.summary, duration: i.duration,
      agentName: i.agentName, createdAt: i.createdAt,
    })),
    scheduledFollowups: mockFollowups.filter(f => f.status !== 'completed' && f.status !== 'cancelled'),
    pendingOutreach: mockFollowups.filter(f => f.status === 'overdue' || f.status === 'due').length,
    lastOutreachDate: daysAgo(1),
    channelsBreakdown: [
      { channel: 'phone', count: mockInteractions.filter(i => i.channel === 'phone').length },
      { channel: 'email', count: mockInteractions.filter(i => i.channel === 'email').length },
      { channel: 'chat', count: mockInteractions.filter(i => i.channel === 'chat').length },
      { channel: 'portal', count: mockInteractions.filter(i => i.channel === 'portal').length },
    ],
  };
  return { data };
}

export async function scheduleCall(_request: ScheduleCallRequest): Promise<{ data: FollowupDTO }> {
  await delay(400);
  const newFollowup: FollowupDTO = {
    id: `flw-${String(mockFollowups.length + 1).padStart(3, '0')}`,
    accountId: _request.accountId,
    accountName: mockAccounts.find(a => a.id === _request.accountId)?.name || '',
    customerId: _request.customerId,
    customerName: mockCustomers.find(c => c.id === _request.customerId)?.name || '',
    type: 'call', subject: _request.subject, description: _request.notes || '',
    priority: 'medium', status: 'open', dueDate: _request.scheduledDate,
    completedDate: null, owner: _request.ownerId, notes: _request.notes || '',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  mockFollowups.push(newFollowup);
  return { data: newFollowup };
}

export async function globalSearch(_request: SearchRequest): Promise<SearchResponse> {
  await delay(400);
  const q = _request.query.toLowerCase();
  const types = _request.entityTypes || [];
  const accounts = (!types.length || types.includes('accounts')) ? mockAccounts.filter(a => a.name.toLowerCase().includes(q)) : [];
  const customers = (!types.length || types.includes('customers')) ? mockCustomers.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) : [];
  const followups = (!types.length || types.includes('followups')) ? mockFollowups.filter(f => f.subject.toLowerCase().includes(q)) : [];
  const tasks = (!types.length || types.includes('tasks')) ? mockTasks.filter(t => t.title.toLowerCase().includes(q)) : [];
  const interactions = (!types.length || types.includes('interactions')) ? mockInteractions.filter(i => i.subject.toLowerCase().includes(q) || i.summary.toLowerCase().includes(q)) : [];
  return { accounts, customers, followups, tasks, interactions, total: accounts.length + customers.length + followups.length + tasks.length + interactions.length };
}

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000).toISOString();
