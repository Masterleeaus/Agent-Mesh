import type { CaseListResponse, CaseDetailResponse, DisputeListResponse, ResolutionListResponse, EscalationListResponse, ApprovalListResponse, EvidenceListResponse, KnowledgeBaseListResponse, DashboardResponse, SearchResponse, TechnicianReportListResponse, CustomerComplaintListResponse } from '../models/api-responses';
import type { CaseDTO, DisputeDTO, ResolutionDTO, EscalationDTO, ApprovalDTO, EvidenceDTO, KnowledgeBaseDTO, TechnicianReportDTO, CustomerComplaintDTO } from '../models/dto';
import type { CaseListFilters, DisputeListFilters, CreateResolutionRequest, ApproveResolutionRequest, RejectResolutionRequest, EscalateCaseRequest, CloseCaseRequest, CreateEvidenceRequest, SearchRequest, KnowledgeBaseFilters } from '../models/api-requests';
import { mockCases, mockDisputes, mockResolutions, mockEvidence, mockEscalations, mockApprovals, mockTechnicianReports, mockCustomerComplaints, mockKnowledgeBase, mockTimelines, mockDashboard } from './mock-data';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function applyCaseFilters(cases: CaseDTO[], filters?: CaseListFilters): CaseDTO[] {
  if (!filters) return cases;
  let filtered = [...cases];
  if (filters.type && filters.type.length > 0) filtered = filtered.filter(c => filters.type!.includes(c.type));
  if (filters.status && filters.status.length > 0) filtered = filtered.filter(c => filters.status!.includes(c.status));
  if (filters.priority && filters.priority.length > 0) filtered = filtered.filter(c => filters.priority!.includes(c.priority));
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(c => c.summary.toLowerCase().includes(q) || c.customerName.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  }
  return filtered;
}

export const resolutionService = {
  async listCases(filters?: CaseListFilters): Promise<CaseListResponse> {
    await delay(300);
    const filtered = applyCaseFilters(mockCases, filters);
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 25;
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);
    return { data: paged, total: filtered.length, page, pageSize };
  },

  async getCaseById(id: string): Promise<CaseDetailResponse> {
    await delay(200);
    const c = mockCases.find(x => x.id === id);
    if (!c) throw new Error(`Case ${id} not found`);
    const dispute = mockDisputes.find(d => d.caseId === id);
    const resolution = mockResolutions.find(r => r.caseId === id);
    const evidence = mockEvidence.filter(e => e.caseId === id);
    const escalations = mockEscalations.filter(e => e.caseId === id);
    const approvals = mockApprovals.filter(a => a.caseId === id);
    const technicianReport = mockTechnicianReports.find(t => t.caseId === id);
    const customerComplaint = mockCustomerComplaints.find(c => c.caseId === id);
    const timeline = mockTimelines[id] || [];
    return { case: c, dispute, resolution, evidence, escalations, approvals, technicianReport, customerComplaint, timeline };
  },

  async listDisputes(filters?: DisputeListFilters): Promise<DisputeListResponse> {
    await delay(300);
    let filtered = [...mockDisputes];
    if (filters?.reason && filters.reason.length > 0) filtered = filtered.filter(d => filters.reason!.includes(d.reason));
    if (filters?.status && filters.status.length > 0) filtered = filtered.filter(d => filters.status!.includes(d.status));
    if (filters?.priority && filters.priority.length > 0) filtered = filtered.filter(d => filters.priority!.includes(d.priority));
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(d => d.customerName.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
    }
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 25;
    return { data: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, pageSize };
  },

  async listResolutions(filters?: CaseListFilters): Promise<ResolutionListResponse> {
    await delay(300);
    let filtered = [...mockResolutions];
    if (filters?.status && filters.status.length > 0) filtered = filtered.filter(r => filters.status!.includes(r.status));
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 25;
    return { data: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, pageSize };
  },

  async listEscalations(filters?: CaseListFilters): Promise<EscalationListResponse> {
    await delay(300);
    let filtered = [...mockEscalations];
    if (filters?.status && filters.status.length > 0) filtered = filtered.filter(e => filters.status!.includes(e.status));
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 25;
    return { data: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, pageSize };
  },

  async listApprovals(filters?: CaseListFilters): Promise<ApprovalListResponse> {
    await delay(300);
    let filtered = [...mockApprovals];
    if (filters?.status && filters.status.length > 0) {
      filtered = filtered.filter(a => filters.status!.includes(a.status as import('./mock-data').ApprovalStatus));
    }
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 25;
    return { data: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, pageSize };
  },

  async listEvidence(caseId: string): Promise<EvidenceListResponse> {
    await delay(200);
    const data = mockEvidence.filter(e => e.caseId === caseId);
    return { data, total: data.length };
  },

  async listTechnicianReports(filters?: CaseListFilters): Promise<TechnicianReportListResponse> {
    await delay(300);
    let filtered = [...mockTechnicianReports];
    if (filters?.status && filters.status.length > 0) {
      filtered = filtered.filter(r => filters.status!.includes(r.status as CaseDTO['status']));
    }
    return { data: filtered, total: filtered.length };
  },

  async listCustomerComplaints(filters?: CaseListFilters): Promise<CustomerComplaintListResponse> {
    await delay(300);
    let filtered = [...mockCustomerComplaints];
    if (filters?.status && filters.status.length > 0) {
      filtered = filtered.filter(c => filters.status!.includes(c.status as CaseDTO['status']));
    }
    return { data: filtered, total: filtered.length };
  },

  async getDashboard(): Promise<DashboardResponse> {
    await delay(300);
    return { ...mockDashboard };
  },

  async search(req: SearchRequest): Promise<SearchResponse> {
    await delay(400);
    const q = req.query.toLowerCase();
    const cases = mockCases.filter(c => c.summary.toLowerCase().includes(q) || c.customerName.toLowerCase().includes(q));
    const disputes = mockDisputes.filter(d => d.customerName.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
    const knowledge = mockKnowledgeBase.filter(k => k.title.toLowerCase().includes(q) || k.content.toLowerCase().includes(q) || k.tags.some(t => t.toLowerCase().includes(q)));
    return { cases, disputes, knowledge, total: cases.length + disputes.length + knowledge.length };
  },

  async listKnowledgeBase(filters?: KnowledgeBaseFilters): Promise<KnowledgeBaseListResponse> {
    await delay(300);
    let filtered = [...mockKnowledgeBase];
    if (filters?.category) filtered = filtered.filter(k => k.category === filters.category);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(k => k.title.toLowerCase().includes(q) || k.content.toLowerCase().includes(q));
    }
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 25;
    return { data: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, pageSize };
  },

  async createResolution(req: CreateResolutionRequest): Promise<ResolutionDTO> {
    await delay(400);
    const newRes: ResolutionDTO = {
      id: `res-${String(mockResolutions.length + 1).padStart(3, '0')}`,
      caseId: req.caseId,
      type: req.type,
      status: 'pending_approval',
      createdBy: 'res-001',
      createdByName: 'Alex Morgan',
      resolution: req.resolution,
      notes: req.notes,
      amount: req.amount,
      currency: req.currency,
      assignedTo: req.assignedTo,
      createdAt: new Date().toISOString(),
    };
    mockResolutions.unshift(newRes);
    return newRes;
  },

  async approveResolution(req: ApproveResolutionRequest): Promise<void> {
    await delay(300);
    const res = mockResolutions.find(r => r.id === req.resolutionId);
    if (res) {
      res.status = 'resolved';
      res.completedAt = new Date().toISOString();
    }
  },

  async rejectResolution(req: RejectResolutionRequest): Promise<void> {
    await delay(300);
    const res = mockResolutions.find(r => r.id === req.resolutionId);
    if (res) {
      res.status = 'pending_review';
      res.notes = req.reason;
    }
  },

  async escalateCase(req: EscalateCaseRequest): Promise<EscalationDTO> {
    await delay(400);
    const esc: EscalationDTO = {
      id: `esc-${String(mockEscalations.length + 1).padStart(3, '0')}`,
      caseId: req.caseId,
      reason: req.reason,
      status: 'pending_review',
      escalatedBy: 'res-001',
      escalatedByName: 'Alex Morgan',
      escalatedTo: req.escalateTo,
      escalatedToName: req.escalateTo,
      notes: req.notes,
      createdAt: new Date().toISOString(),
    };
    mockEscalations.unshift(esc);
    return esc;
  },

  async closeCase(req: CloseCaseRequest): Promise<void> {
    await delay(300);
    const c = mockCases.find(x => x.id === req.caseId);
    if (c) {
      c.status = 'closed';
      c.closedAt = new Date().toISOString();
      c.updatedAt = new Date().toISOString();
    }
  },

  async addEvidence(req: CreateEvidenceRequest): Promise<EvidenceDTO> {
    await delay(300);
    const ev: EvidenceDTO = {
      id: `ev-${String(mockEvidence.length + 1).padStart(3, '0')}`,
      caseId: req.caseId,
      type: req.type,
      title: req.title,
      description: req.description,
      url: req.url,
      uploadedBy: 'res-001',
      uploadedByName: 'Alex Morgan',
      createdAt: new Date().toISOString(),
    };
    mockEvidence.unshift(ev);
    return ev;
  },
};
