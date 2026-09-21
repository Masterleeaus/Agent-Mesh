import type { JobListResponse, JobDetailResponse, DashboardResponse, CustomerDetailResponse, EvidenceUploadResponse } from '../models/api-responses';
import type { JobListFilters, UpdateJobStatusRequest, AddNotesRequest, UploadEvidenceRequest, RequestPartsRequest, EscalateJobRequest, CompleteJobRequest, PauseJobRequest, ResumeJobRequest, UpdateChecklistItemRequest, SendMessageRequest, UpdateProfileRequest, UpdateSettingsRequest } from '../models/api-requests';
import type { JobDTO, NotificationDTO, MessageDTO, PartDTO } from '../models/dto';
import { mockJobs, mockCustomers, mockChecklists, mockServiceNotes, mockParts, mockEvidence, mockSignatures, mockMessages, mockNotifications, mockTimelines, mockDashboard, defaultTechnicianProfile } from './mock-data';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function applyFilters(jobs: JobDTO[], filters?: JobListFilters): JobDTO[] {
  if (!filters) return jobs;
  let filtered = [...jobs];

  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter(j => filters.status!.includes(j.status));
  }
  if (filters.serviceType && filters.serviceType.length > 0) {
    filtered = filtered.filter(j => filters.serviceType!.includes(j.serviceType));
  }
  if (filters.priority && filters.priority.length > 0) {
    filtered = filtered.filter(j => filters.priority!.includes(j.priority));
  }
  if (filters.technicianId) {
    filtered = filtered.filter(j => j.technicianId === filters.technicianId);
  }
  if (filters.isEscalated) {
    filtered = filtered.filter(j => j.status === 'escalated');
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(j =>
      j.title.toLowerCase().includes(q) ||
      j.customerName.toLowerCase().includes(q) ||
      j.description.toLowerCase().includes(q) ||
      j.customerAddress.toLowerCase().includes(q)
    );
  }
  if (filters.dateFrom) {
    filtered = filtered.filter(j => j.scheduledDate >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    filtered = filtered.filter(j => j.scheduledDate <= filters.dateTo!);
  }

  return filtered;
}

export const technicianService = {
  async getDashboard(): Promise<DashboardResponse> {
    await delay(300);
    const today = new Date().toISOString().split('T')[0];
    const todayJobs = mockJobs.filter(j => j.scheduledDate === today);
    const currentJob = todayJobs.find(j => j.status === 'in_progress' || j.status === 'paused');
    const nextAppointment = todayJobs
      .filter(j => j.status === 'assigned' || j.status === 'en_route')
      .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart))[0];
    const urgentJobs = todayJobs.filter(j => j.priority === 'urgent' || j.priority === 'high');
    const completedJobsToday = todayJobs.filter(j => j.status === 'completed').length;

    return {
      todayJobs,
      currentJob,
      nextAppointment,
      urgentJobs,
      completionRate: mockDashboard.completionRate,
      totalJobsToday: todayJobs.length,
      completedJobsToday,
      unreadMessages: mockDashboard.unreadMessages,
      unreadNotifications: mockDashboard.unreadNotifications,
      travelStatus: currentJob ? {
        distance: currentJob.travelDistance || 0,
        duration: currentJob.travelDuration || 0,
        destination: currentJob.customerAddress,
      } : undefined,
    };
  },

  async listJobs(filters?: JobListFilters): Promise<JobListResponse> {
    await delay(300);
    const filtered = applyFilters(mockJobs, filters);
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 25;
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);
    return { data: paged, total: filtered.length, page, pageSize };
  },

  async getJobById(id: string): Promise<JobDetailResponse> {
    await delay(200);
    const job = mockJobs.find(j => j.id === id);
    if (!job) throw new Error(`Job ${id} not found`);
    const customer = mockCustomers.find(c => c.id === job.customerId) || mockCustomers[0];
    const checklist = mockChecklists[job.checklistId || ''];
    const notes = mockServiceNotes[id] || [];
    const parts = mockParts[id] || [];
    const evidence = mockEvidence[id] || [];
    const signature = mockSignatures[id];
    const messages = mockMessages[id] || [];
    const timeline = mockTimelines[id] || [];
    return { job, customer, checklist, notes, parts, evidence, signature, messages, timeline };
  },

  async updateJobStatus(id: string, req: UpdateJobStatusRequest): Promise<JobDTO> {
    await delay(200);
    const job = mockJobs.find(j => j.id === id);
    if (!job) throw new Error(`Job ${id} not found`);
    job.status = req.status;
    job.updatedAt = new Date().toISOString();
    if (req.status === 'completed') job.completedAt = new Date().toISOString();
    return job;
  },

  async addNotes(id: string, req: AddNotesRequest): Promise<void> {
    await delay(200);
    const note = {
      id: `note-${Date.now()}`,
      jobId: id,
      technicianId: 'tech-001',
      technicianName: 'Marcus Rivera',
      content: req.content,
      category: req.category,
      createdAt: new Date().toISOString(),
    };
    if (!mockServiceNotes[id]) mockServiceNotes[id] = [];
    mockServiceNotes[id].push(note);
  },

  async uploadEvidence(id: string, _req: UploadEvidenceRequest): Promise<EvidenceUploadResponse> {
    await delay(400);
    const ev = {
      id: `ev-${Date.now()}`,
      jobId: id,
      type: _req.type,
      url: `/mock/ev/${_req.fileName}`,
      thumbnailUrl: _req.type === 'photo' ? `/mock/ev/thumb-${_req.fileName}` : undefined,
      fileName: _req.fileName,
      fileSize: _req.fileSize,
      mimeType: _req.mimeType,
      caption: _req.caption,
      latitude: _req.latitude,
      longitude: _req.longitude,
      createdAt: new Date().toISOString(),
    };
    if (!mockEvidence[id]) mockEvidence[id] = [];
    mockEvidence[id].push(ev);
    return { id: ev.id, url: ev.url!, thumbnailUrl: ev.thumbnailUrl };
  },

  async requestParts(id: string, req: RequestPartsRequest): Promise<void> {
    await delay(300);
    const part: PartDTO = {
      id: `part-${Date.now()}`,
      jobId: id,
      name: req.name,
      sku: req.sku,
      quantity: req.quantity,
      unitPrice: 0,
      totalPrice: 0,
      category: 'requested',
      usedAt: new Date().toISOString(),
    };
    if (!mockParts[id]) mockParts[id] = [];
    mockParts[id].push(part);
  },

  async escalateJob(id: string, req: EscalateJobRequest): Promise<void> {
    await delay(300);
    const job = mockJobs.find(j => j.id === id);
    if (job) {
      job.status = 'escalated';
      job.escalationReason = req.reason;
      job.escalatedTo = req.escalateTo || 'Operations Manager';
      job.updatedAt = new Date().toISOString();
    }
  },

  async completeJob(id: string, req: CompleteJobRequest): Promise<void> {
    await delay(300);
    const job = mockJobs.find(j => j.id === id);
    if (job) {
      job.status = 'completed';
      job.completionNotes = req.completionNotes;
      job.completedAt = new Date().toISOString();
      job.updatedAt = new Date().toISOString();
      if (req.signatureData) {
        mockSignatures[id] = {
          id: `sig-${Date.now()}`,
          jobId: id,
          data: req.signatureData,
          customerName: req.signatureCustomerName || 'Customer',
          signedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
      }
    }
  },

  async pauseJob(id: string, req: PauseJobRequest): Promise<void> {
    await delay(200);
    const job = mockJobs.find(j => j.id === id);
    if (job) {
      job.status = 'paused';
      job.pauseReason = req.reason;
      job.pausedAt = new Date().toISOString();
      job.updatedAt = new Date().toISOString();
    }
  },

  async resumeJob(id: string, req: ResumeJobRequest): Promise<void> {
    await delay(200);
    const job = mockJobs.find(j => j.id === id);
    if (job) {
      job.status = 'on_site';
      job.pauseReason = undefined;
      job.pausedAt = undefined;
      job.updatedAt = new Date().toISOString();
    }
  },

  async updateChecklistItem(id: string, req: UpdateChecklistItemRequest): Promise<void> {
    await delay(150);
    for (const cl of Object.values(mockChecklists)) {
      if (cl.jobId !== id) continue;
      const item = cl.items.find(i => i.id === req.itemId);
      if (item) {
        item.completed = req.completed;
        item.notes = req.notes;
        if (req.completed) item.completedAt = new Date().toISOString();
      }
    }
  },

  async getChecklist(id: string) {
    await delay(150);
    return mockChecklists[id] || null;
  },

  async getCustomerDetail(id: string): Promise<CustomerDetailResponse> {
    await delay(200);
    const customer = mockCustomers.find(c => c.id === id);
    if (!customer) throw new Error(`Customer ${id} not found`);
    const jobHistory = mockJobs.filter(j => j.customerId === id);
    return { customer, jobHistory };
  },

  async getNotifications(): Promise<NotificationDTO[]> {
    await delay(200);
    return [...mockNotifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async markNotificationRead(id: string): Promise<void> {
    await delay(100);
    const n = mockNotifications.find(n => n.id === id);
    if (n) n.read = true;
  },

  async markAllNotificationsRead(): Promise<void> {
    await delay(100);
    mockNotifications.forEach(n => { n.read = true; });
  },

  async getMessages(jobId: string): Promise<MessageDTO[]> {
    await delay(200);
    return mockMessages[jobId] || [];
  },

  async sendMessage(jobId: string, req: SendMessageRequest): Promise<void> {
    await delay(200);
    const msg: MessageDTO = {
      id: `msg-${Date.now()}`,
      jobId,
      senderId: 'tech-001',
      senderName: 'Marcus Rivera',
      senderRole: 'technician',
      body: req.body,
      read: true,
      createdAt: new Date().toISOString(),
    };
    if (!mockMessages[jobId]) mockMessages[jobId] = [];
    mockMessages[jobId].push(msg);
  },

  async getProfile() {
    await delay(200);
    return { ...defaultTechnicianProfile };
  },

  async updateProfile(_req: UpdateProfileRequest): Promise<void> {
    await delay(300);
  },

  async getSettings() {
    await delay(200);
    return {
      notificationsEnabled: true,
      autoAcceptJobs: false,
      defaultView: 'list' as const,
      language: 'en',
    };
  },

  async updateSettings(_req: UpdateSettingsRequest): Promise<void> {
    await delay(300);
  },

  async getJobHistory(filters?: JobListFilters): Promise<JobListResponse> {
    await delay(300);
    const completed = mockJobs.filter(j => j.status === 'completed');
    const filtered = filters ? applyFilters(completed, filters) : completed;
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 25;
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);
    return { data: paged, total: filtered.length, page, pageSize };
  },

  async getPartsHistory(): Promise<PartDTO[]> {
    await delay(200);
    return Object.values(mockParts).flat();
  },
};
