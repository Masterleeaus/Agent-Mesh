import type { OperationsListFilters, DispatchOperationRequest, ReassignTechnicianRequest, EscalateOperationRequest, CloseOperationRequest, UpdateOperationStatusRequest, SearchOperationsRequest } from '../models/api-requests';
import type {
  OperationsListResponse, OperationDetailResponse, TechniciansListResponse,
  DispatchQueueResponse, EscalationsListResponse, TimelineResponse,
  RegionsListResponse, DashboardMetricsResponse, TechniciansStatusResponse,
} from '../models/api-responses';
import {
  mockOperations, mockTechnicians, mockDispatches, mockEscalations,
  mockTimeline, mockRegions, mockDashboardMetrics, mockLiveMetrics,
} from './mock-data';

function delay(ms: number = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function filterOperations(ops: typeof mockOperations, filters?: OperationsListFilters) {
  if (!filters) return ops;
  return ops.filter(op => {
    if (filters.status && filters.status.length > 0 && !filters.status.includes(op.status)) return false;
    if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(op.priority)) return false;
    if (filters.type && filters.type.length > 0 && !filters.type.includes(op.type)) return false;
    if (filters.region && filters.region.length > 0 && !filters.region.includes(op.region)) return false;
    if (filters.technicianId && op.technicianId !== filters.technicianId) return false;
    if (filters.isEscalated !== undefined && filters.isEscalated !== (op.status === 'escalated')) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!op.title.toLowerCase().includes(q) && !op.customerName.toLowerCase().includes(q) && !op.customerAddress.toLowerCase().includes(q)) return false;
    }
    if (filters.dateFrom && op.scheduledStart && op.scheduledStart < filters.dateFrom) return false;
    if (filters.dateTo && op.scheduledStart && op.scheduledStart > filters.dateTo) return false;
    return true;
  });
}

export const operationsService = {
  async list(filters?: OperationsListFilters): Promise<OperationsListResponse> {
    await delay();
    const filtered = filterOperations(mockOperations, filters);
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 25;
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);
    return { data: paged, total: filtered.length, page, pageSize };
  },

  async getById(id: string): Promise<OperationDetailResponse> {
    await delay();
    const operation = mockOperations.find(op => op.id === id);
    if (!operation) throw new Error(`Operation ${id} not found`);
    const technician = mockTechnicians.find(t => t.id === operation.technicianId);
    const dispatches = mockDispatches.filter(d => d.operationId === id);
    const timeline = mockTimeline.filter(t => t.operationId === id);
    const escalations = mockEscalations.filter(e => e.operationId === id);
    return { operation, technician, dispatches, timeline, escalations };
  },

  async getTechnicians(): Promise<TechniciansListResponse> {
    await delay();
    return { data: mockTechnicians, total: mockTechnicians.length };
  },

  async getTechniciansStatus(): Promise<TechniciansStatusResponse> {
    await delay();
    const available = mockTechnicians.filter(t => t.status === 'available').length;
    const enRoute = mockTechnicians.filter(t => t.status === 'en_route').length;
    const onSite = mockTechnicians.filter(t => t.status === 'on_site').length;
    const offline = mockTechnicians.filter(t => t.status === 'offline').length;
    return { data: mockTechnicians, total: mockTechnicians.length, available, enRoute, onSite, offline };
  },

  async getDispatchQueue(): Promise<DispatchQueueResponse> {
    await delay();
    const pendingOps = mockOperations.filter(op => op.status === 'pending_dispatch' || op.status === 'dispatched');
    return { data: mockDispatches, total: mockDispatches.length, pendingCount: pendingOps.length };
  },

  async getEscalations(): Promise<EscalationsListResponse> {
    await delay();
    return { data: mockEscalations, total: mockEscalations.length, openCount: mockEscalations.filter(e => e.status === 'open').length };
  },

  async getTimeline(): Promise<TimelineResponse> {
    await delay();
    return { data: mockTimeline, total: mockTimeline.length };
  },

  async getRegions(): Promise<RegionsListResponse> {
    await delay();
    return { data: mockRegions };
  },

  async getDashboardMetrics(): Promise<DashboardMetricsResponse> {
    await delay();
    return {
      metrics: mockDashboardMetrics,
      liveMetrics: mockLiveMetrics,
      regionalStatus: mockRegions.map(r => ({
        region: r.id,
        regionName: r.name,
        activeOperations: r.inProgressOperations,
        availableTechnicians: r.activeTechnicians,
        overdueCount: 0,
        color: r.color,
      })),
    };
  },

  async dispatch(request: DispatchOperationRequest): Promise<void> {
    await delay();
    const op = mockOperations.find(o => o.id === request.operationId);
    if (op) {
      op.status = 'dispatched';
      op.technicianId = request.technicianId;
      const tech = mockTechnicians.find(t => t.id === request.technicianId);
      if (tech) op.technicianName = tech.name;
    }
  },

  async reassign(request: ReassignTechnicianRequest): Promise<void> {
    await delay();
    const op = mockOperations.find(o => o.id === request.operationId);
    if (op) {
      op.technicianId = request.newTechnicianId;
      const tech = mockTechnicians.find(t => t.id === request.newTechnicianId);
      if (tech) op.technicianName = tech.name;
    }
  },

  async escalate(request: EscalateOperationRequest): Promise<void> {
    await delay();
    const op = mockOperations.find(o => o.id === request.operationId);
    if (op) {
      op.status = 'escalated';
      op.escalationReason = request.reason;
      op.escalatedTo = request.escalateTo;
    }
  },

  async close(request: CloseOperationRequest): Promise<void> {
    await delay();
    const op = mockOperations.find(o => o.id === request.operationId);
    if (op) {
      op.status = 'completed';
      op.completedAt = new Date().toISOString();
      op.actualEnd = new Date().toISOString();
    }
  },

  async updateStatus(request: UpdateOperationStatusRequest): Promise<void> {
    await delay();
    const op = mockOperations.find(o => o.id === request.operationId);
    if (op) {
      op.status = request.status;
      if (request.status === 'in_progress' && !op.actualStart) op.actualStart = new Date().toISOString();
      if (request.status === 'completed') {
        op.completedAt = new Date().toISOString();
        op.actualEnd = new Date().toISOString();
      }
    }
  },

  async search(request: SearchOperationsRequest): Promise<OperationsListResponse> {
    await delay();
    const filtered = filterOperations(mockOperations, { ...request.filters, search: request.query });
    return { data: filtered, total: filtered.length, page: 1, pageSize: filtered.length };
  },

  async getDailyOperations(date: string): Promise<OperationsListResponse> {
    await delay();
    const filtered = mockOperations.filter(op => {
      return op.scheduledStart && op.scheduledStart.startsWith(date);
    });
    return { data: filtered, total: filtered.length, page: 1, pageSize: filtered.length };
  },

  async getRegionalOperations(region: string): Promise<OperationsListResponse> {
    await delay();
    const filtered = mockOperations.filter(op => op.region === region);
    return { data: filtered, total: filtered.length, page: 1, pageSize: filtered.length };
  },

  async getCompletedOperations(): Promise<OperationsListResponse> {
    await delay();
    const filtered = mockOperations.filter(op => op.status === 'completed');
    return { data: filtered, total: filtered.length, page: 1, pageSize: filtered.length };
  },
};
