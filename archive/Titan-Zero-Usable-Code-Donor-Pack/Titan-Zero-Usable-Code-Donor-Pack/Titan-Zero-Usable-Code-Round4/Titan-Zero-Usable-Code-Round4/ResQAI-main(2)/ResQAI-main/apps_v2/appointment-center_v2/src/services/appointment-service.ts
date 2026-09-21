import type { AppointmentDTO, TechnicianDTO, ServiceTypeDTO, TimeSlotDTO, AppointmentHistoryEventDTO, AppointmentStatsDTO } from '../models/dto';
import type {
  AppointmentListResponse, AppointmentDetailResponse, TechnicianListResponse,
  TechnicianScheduleResponse, ServiceTypeListResponse, AvailableSlotsResponse,
  AppointmentHistoryResponse, DashboardStatsResponse, ReportResponse, SearchResponse,
} from '../models/api-responses';
import type {
  CreateAppointmentRequest, UpdateAppointmentRequest, RescheduleRequest,
  AssignTechnicianRequest, CancelAppointmentRequest, CompleteAppointmentRequest,
  CreateServiceTypeRequest, UpdateServiceTypeRequest, AppointmentListFilters, GenerateReportRequest,
} from '../models/api-requests';
import { AppointmentStatus, TechnicianSkill, ServiceCategory, AppointmentType } from '../models/dto';
import type { ReportStatsVM, SearchResultVM } from '../models/view-models';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const now = new Date();
const today = now.toISOString().split('T')[0];
const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
const nextWeek = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0];

const mockAppointments: AppointmentDTO[] = [
  { id: 'a1', customerId: 'c1', customerName: 'Alice Johnson', customerPhone: '555-0101', customerEmail: 'alice@example.com', customerAddress: '123 Oak St', serviceTypeId: 's1', serviceTypeName: 'AC Repair', serviceCategory: ServiceCategory.Repair, technicianId: 't1', technicianName: 'Mike Smith', date: today, timeSlot: '09:00-10:00', durationMinutes: 60, status: AppointmentStatus.Scheduled, type: AppointmentType.Standard, notes: '', createdAt: '2026-06-28T10:00:00Z', updatedAt: '2026-06-28T10:00:00Z' },
  { id: 'a2', customerId: 'c2', customerName: 'Bob Williams', customerPhone: '555-0102', customerEmail: 'bob@example.com', customerAddress: '456 Pine St', serviceTypeId: 's2', serviceTypeName: 'Plumbing', serviceCategory: ServiceCategory.Repair, technicianId: 't2', technicianName: 'Sarah Lee', date: today, timeSlot: '10:00-11:00', durationMinutes: 60, status: AppointmentStatus.Confirmed, type: AppointmentType.Standard, notes: 'Check basement pipes', createdAt: '2026-06-27T14:00:00Z', updatedAt: '2026-06-29T08:00:00Z' },
  { id: 'a3', customerId: 'c3', customerName: 'Carol Davis', customerPhone: '555-0103', customerEmail: 'carol@example.com', customerAddress: '789 Maple Ave', serviceTypeId: 's3', serviceTypeName: 'Electrical Wiring', serviceCategory: ServiceCategory.Installation, technicianId: 't1', technicianName: 'Mike Smith', date: today, timeSlot: '13:00-15:00', durationMinutes: 120, status: AppointmentStatus.InProgress, type: AppointmentType.Standard, notes: '', createdAt: '2026-06-26T09:00:00Z', updatedAt: '2026-07-01T13:00:00Z' },
  { id: 'a4', customerId: 'c4', customerName: 'David Brown', customerPhone: '555-0104', customerEmail: 'david@example.com', customerAddress: '321 Elm St', serviceTypeId: 's1', serviceTypeName: 'AC Repair', serviceCategory: ServiceCategory.Repair, technicianId: 't3', technicianName: 'James Wilson', date: today, timeSlot: '09:00-10:00', durationMinutes: 60, status: AppointmentStatus.Completed, type: AppointmentType.Standard, notes: 'Replaced filter', completedAt: new Date().toISOString(), completedNotes: 'Filter replaced successfully', createdAt: '2026-06-25T11:00:00Z', updatedAt: '2026-06-30T10:00:00Z' },
  { id: 'a5', customerId: 'c5', customerName: 'Eve Martinez', customerPhone: '555-0105', customerEmail: 'eve@example.com', customerAddress: '654 Birch Rd', serviceTypeId: 's4', serviceTypeName: 'Painting', serviceCategory: ServiceCategory.Maintenance, technicianId: 't2', technicianName: 'Sarah Lee', date: tomorrow, timeSlot: '08:00-12:00', durationMinutes: 240, status: AppointmentStatus.Scheduled, type: AppointmentType.Standard, notes: 'Living room and kitchen', createdAt: '2026-06-29T07:00:00Z', updatedAt: '2026-06-29T07:00:00Z' },
  { id: 'a6', customerId: 'c6', customerName: 'Frank Moore', customerPhone: '555-0106', customerEmail: 'frank@example.com', customerAddress: '987 Cedar Ln', serviceTypeId: 's5', serviceTypeName: 'General Maintenance', serviceCategory: ServiceCategory.Maintenance, technicianId: 't4', technicianName: 'Emily Chen', date: tomorrow, timeSlot: '10:00-11:00', durationMinutes: 60, status: AppointmentStatus.Scheduled, type: AppointmentType.Standard, notes: '', createdAt: '2026-06-30T09:00:00Z', updatedAt: '2026-06-30T09:00:00Z' },
  { id: 'a7', customerId: 'c1', customerName: 'Alice Johnson', customerPhone: '555-0101', customerEmail: 'alice@example.com', customerAddress: '123 Oak St', serviceTypeId: 's2', serviceTypeName: 'Plumbing', serviceCategory: ServiceCategory.Repair, technicianId: 't3', technicianName: 'James Wilson', date: yesterday, timeSlot: '14:00-15:00', durationMinutes: 60, status: AppointmentStatus.Completed, type: AppointmentType.Standard, notes: 'Fixed leak', completedAt: yesterday + 'T15:00:00Z', createdAt: '2026-06-24T08:00:00Z', updatedAt: '2026-06-29T15:00:00Z' },
  { id: 'a8', customerId: 'c7', customerName: 'Grace Chen', customerPhone: '555-0107', customerEmail: 'grace@example.com', customerAddress: '246 Walnut Dr', serviceTypeId: 's3', serviceTypeName: 'Electrical Wiring', serviceCategory: ServiceCategory.Installation, technicianId: '', technicianName: 'Unassigned', date: tomorrow, timeSlot: '09:00-11:00', durationMinutes: 120, status: AppointmentStatus.Scheduled, type: AppointmentType.Emergency, notes: 'Power outage in kitchen', createdAt: '2026-07-01T06:00:00Z', updatedAt: '2026-07-01T06:00:00Z' },
  { id: 'a9', customerId: 'c8', customerName: 'Henry Wilson', customerPhone: '555-0108', customerEmail: 'henry@example.com', customerAddress: '135 Spruce Ct', serviceTypeId: 's1', serviceTypeName: 'AC Repair', serviceCategory: ServiceCategory.Repair, technicianId: '', technicianName: 'Unassigned', date: today, timeSlot: '15:00-16:00', durationMinutes: 60, status: AppointmentStatus.Scheduled, type: AppointmentType.Standard, notes: 'AC not cooling', createdAt: '2026-07-01T08:00:00Z', updatedAt: '2026-07-01T08:00:00Z' },
  { id: 'a10', customerId: 'c3', customerName: 'Carol Davis', customerPhone: '555-0103', customerEmail: 'carol@example.com', customerAddress: '789 Maple Ave', serviceTypeId: 's2', serviceTypeName: 'Plumbing', serviceCategory: ServiceCategory.Repair, technicianId: 't2', technicianName: 'Sarah Lee', date: yesterday, timeSlot: '09:00-10:00', durationMinutes: 60, status: AppointmentStatus.Cancelled, type: AppointmentType.Standard, notes: 'Customer cancelled', reason: 'Customer changed mind', cancelledBy: 'customer', cancelledAt: yesterday + 'T08:00:00Z', createdAt: '2026-06-23T10:00:00Z', updatedAt: '2026-06-29T08:00:00Z' },
  { id: 'a11', customerId: 'c4', customerName: 'David Brown', customerPhone: '555-0104', customerEmail: 'david@example.com', customerAddress: '321 Elm St', serviceTypeId: 's5', serviceTypeName: 'General Maintenance', serviceCategory: ServiceCategory.Maintenance, technicianId: 't4', technicianName: 'Emily Chen', date: nextWeek, timeSlot: '09:00-10:00', durationMinutes: 60, status: AppointmentStatus.Scheduled, type: AppointmentType.Recurring, notes: 'Monthly maintenance', createdAt: '2026-06-20T09:00:00Z', updatedAt: '2026-06-20T09:00:00Z' },
  { id: 'a12', customerId: 'c5', customerName: 'Eve Martinez', customerPhone: '555-0105', customerEmail: 'eve@example.com', customerAddress: '654 Birch Rd', serviceTypeId: 's4', serviceTypeName: 'Painting', serviceCategory: ServiceCategory.Maintenance, technicianId: '', technicianName: 'Unassigned', date: nextWeek, timeSlot: '08:00-12:00', durationMinutes: 240, status: AppointmentStatus.Scheduled, type: AppointmentType.Standard, notes: 'Exterior painting', createdAt: '2026-06-22T11:00:00Z', updatedAt: '2026-06-22T11:00:00Z' },
];

const mockTechnicians: TechnicianDTO[] = [
  { id: 't1', name: 'Mike Smith', email: 'mike@resqai.com', phone: '555-9001', skills: [TechnicianSkill.Electrical, TechnicianSkill.HVAC, TechnicianSkill.General], rating: 4.8, availability: ['09:00-17:00'], activeAppointments: 3, completedToday: 1, nextAvailable: '15:00', isOnline: true, location: 'Downtown' },
  { id: 't2', name: 'Sarah Lee', email: 'sarah@resqai.com', phone: '555-9002', skills: [TechnicianSkill.Plumbing, TechnicianSkill.Painting, TechnicianSkill.General], rating: 4.6, availability: ['08:00-16:00'], activeAppointments: 2, completedToday: 0, nextAvailable: '11:00', isOnline: true, location: 'Westside' },
  { id: 't3', name: 'James Wilson', email: 'james@resqai.com', phone: '555-9003', skills: [TechnicianSkill.HVAC, TechnicianSkill.General], rating: 4.9, availability: ['09:00-18:00'], activeAppointments: 1, completedToday: 2, nextAvailable: '10:00', isOnline: true, location: 'Eastside' },
  { id: 't4', name: 'Emily Chen', email: 'emily@resqai.com', phone: '555-9004', skills: [TechnicianSkill.Electrical, TechnicianSkill.Carpentry], rating: 4.7, availability: ['10:00-18:00'], activeAppointments: 0, completedToday: 0, nextAvailable: '10:00', isOnline: false, location: 'Suburbs' },
];

const mockServiceTypes: ServiceTypeDTO[] = [
  { id: 's1', name: 'AC Repair', description: 'Air conditioning repair and maintenance', category: ServiceCategory.Repair, durationMinutes: 60, requiredSkills: [TechnicianSkill.HVAC], bufferMinutes: 15, isActive: true },
  { id: 's2', name: 'Plumbing', description: 'Pipe repair, faucet installation, drain cleaning', category: ServiceCategory.Repair, durationMinutes: 60, requiredSkills: [TechnicianSkill.Plumbing], bufferMinutes: 15, isActive: true },
  { id: 's3', name: 'Electrical Wiring', description: 'Electrical rewiring, outlet installation, panel upgrades', category: ServiceCategory.Installation, durationMinutes: 120, requiredSkills: [TechnicianSkill.Electrical], bufferMinutes: 30, isActive: true },
  { id: 's4', name: 'Painting', description: 'Interior and exterior painting services', category: ServiceCategory.Maintenance, durationMinutes: 240, requiredSkills: [TechnicianSkill.Painting], bufferMinutes: 30, isActive: true },
  { id: 's5', name: 'General Maintenance', description: 'General handyman services', category: ServiceCategory.Maintenance, durationMinutes: 60, requiredSkills: [TechnicianSkill.General], bufferMinutes: 15, isActive: true },
];

const mockSlots: TimeSlotDTO[] = [
  { start: '08:00', end: '09:00', available: true, label: '08:00 - 09:00' },
  { start: '09:00', end: '10:00', available: true, label: '09:00 - 10:00' },
  { start: '10:00', end: '11:00', available: true, label: '10:00 - 11:00' },
  { start: '11:00', end: '12:00', available: true, label: '11:00 - 12:00' },
  { start: '13:00', end: '14:00', available: true, label: '13:00 - 14:00' },
  { start: '14:00', end: '15:00', available: true, label: '14:00 - 15:00' },
  { start: '15:00', end: '16:00', available: true, label: '15:00 - 16:00' },
  { start: '16:00', end: '17:00', available: true, label: '16:00 - 17:00' },
];

const mockTimeline: AppointmentHistoryEventDTO[] = [
  { id: 'e1', appointmentId: 'a1', eventType: 'created', description: 'Appointment created', actorName: 'System', actorRole: 'system', timestamp: '2026-06-28T10:00:00Z' },
  { id: 'e2', appointmentId: 'a1', eventType: 'assigned', description: 'Assigned to Mike Smith', actorName: 'Admin', actorRole: 'agent', timestamp: '2026-06-28T10:05:00Z' },
  { id: 'e3', appointmentId: 'a2', eventType: 'created', description: 'Appointment created', actorName: 'System', actorRole: 'system', timestamp: '2026-06-27T14:00:00Z' },
  { id: 'e4', appointmentId: 'a2', eventType: 'assigned', description: 'Assigned to Sarah Lee', actorName: 'Admin', actorRole: 'agent', timestamp: '2026-06-27T14:30:00Z' },
  { id: 'e5', appointmentId: 'a2', eventType: 'confirmed', description: 'Appointment confirmed by customer', actorName: 'Bob Williams', actorRole: 'customer', timestamp: '2026-06-29T08:00:00Z' },
  { id: 'e6', appointmentId: 'a3', eventType: 'created', description: 'Appointment created', actorName: 'System', actorRole: 'system', timestamp: '2026-06-26T09:00:00Z' },
  { id: 'e7', appointmentId: 'a3', eventType: 'in_progress', description: 'Service started', actorName: 'Mike Smith', actorRole: 'agent', timestamp: '2026-07-01T13:00:00Z' },
  { id: 'e8', appointmentId: 'a4', eventType: 'created', description: 'Appointment created', actorName: 'System', actorRole: 'system', timestamp: '2026-06-25T11:00:00Z' },
  { id: 'e9', appointmentId: 'a4', eventType: 'assigned', description: 'Assigned to James Wilson', actorName: 'Admin', actorRole: 'agent', timestamp: '2026-06-25T11:30:00Z' },
  { id: 'e10', appointmentId: 'a4', eventType: 'completed', description: 'Service completed - Replaced filter', actorName: 'James Wilson', actorRole: 'agent', timestamp: '2026-06-30T10:00:00Z' },
  { id: 'e11', appointmentId: 'a7', eventType: 'created', description: 'Appointment created', actorName: 'System', actorRole: 'system', timestamp: '2026-06-24T08:00:00Z' },
  { id: 'e12', appointmentId: 'a7', eventType: 'completed', description: 'Service completed - Fixed leak', actorName: 'James Wilson', actorRole: 'agent', timestamp: yesterday + 'T15:00:00Z' },
  { id: 'e13', appointmentId: 'a10', eventType: 'created', description: 'Appointment created', actorName: 'System', actorRole: 'system', timestamp: '2026-06-23T10:00:00Z' },
  { id: 'e14', appointmentId: 'a10', eventType: 'cancelled', description: 'Customer cancelled: Customer changed mind', actorName: 'Customer', actorRole: 'customer', timestamp: yesterday + 'T08:00:00Z' },
  { id: 'e15', appointmentId: 'a8', eventType: 'created', description: 'Emergency appointment created', actorName: 'System', actorRole: 'system', timestamp: '2026-07-01T06:00:00Z' },
];

let nextId = 100;

export const appointmentService = {
  async list(filters?: AppointmentListFilters): Promise<AppointmentListResponse> {
    await delay(400);
    let filtered = [...mockAppointments];
    if (filters?.status?.length) filtered = filtered.filter(a => filters.status!.includes(a.status));
    if (filters?.date) filtered = filtered.filter(a => a.date === filters.date);
    if (filters?.dateFrom) filtered = filtered.filter(a => a.date >= filters.dateFrom!);
    if (filters?.dateTo) filtered = filtered.filter(a => a.date <= filters.dateTo!);
    if (filters?.technicianId) filtered = filtered.filter(a => a.technicianId === filters.technicianId);
    if (filters?.serviceTypeId) filtered = filtered.filter(a => a.serviceTypeId === filters.serviceTypeId);
    if (filters?.type) filtered = filtered.filter(a => a.type === filters.type);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(a =>
        a.customerName.toLowerCase().includes(q) ||
        a.serviceTypeName.toLowerCase().includes(q) ||
        a.technicianName.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      );
    }
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 50;
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);
    return { appointments: paged, total: filtered.length, page, pageSize };
  },

  async getById(id: string): Promise<AppointmentDetailResponse> {
    await delay(300);
    const appointment = mockAppointments.find(a => a.id === id);
    if (!appointment) throw new Error('Appointment not found');
    const timeline = mockTimeline.filter(e => e.appointmentId === id);
    return { appointment, timeline };
  },

  async create(req: CreateAppointmentRequest): Promise<AppointmentDTO> {
    await delay(500);
    const service = mockServiceTypes.find(s => s.id === req.serviceTypeId);
    const tech = mockTechnicians.find(t => t.id === req.technicianId);
    const dto: AppointmentDTO = {
      id: `a${nextId++}`,
      customerId: req.customerId || `c${nextId}`,
      customerName: req.customerName || req.customerId,
      customerPhone: req.customerPhone || '',
      customerEmail: req.customerEmail || '',
      customerAddress: req.customerAddress || '',
      serviceTypeId: req.serviceTypeId,
      serviceTypeName: service?.name || req.serviceTypeId,
      serviceCategory: service?.category || ServiceCategory.Repair,
      technicianId: req.technicianId,
      technicianName: tech?.name || req.technicianId || 'Unassigned',
      date: req.date,
      timeSlot: req.timeSlot,
      durationMinutes: service?.durationMinutes || 60,
      status: AppointmentStatus.Scheduled,
      type: req.type || AppointmentType.Standard,
      notes: req.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockAppointments.push(dto);
    mockTimeline.push({
      id: `e${nextId++}`, appointmentId: dto.id, eventType: 'created',
      description: 'Appointment created', actorName: 'System', actorRole: 'system',
      timestamp: dto.createdAt,
    });
    return dto;
  },

  async update(id: string, req: UpdateAppointmentRequest): Promise<AppointmentDTO> {
    await delay(300);
    const idx = mockAppointments.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Appointment not found');
    const updated = { ...mockAppointments[idx], ...req, updatedAt: new Date().toISOString() };
    mockAppointments[idx] = updated;
    return updated;
  },

  async assignTechnician(id: string, req: AssignTechnicianRequest): Promise<AppointmentDTO> {
    await delay(300);
    const idx = mockAppointments.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Appointment not found');
    const tech = mockTechnicians.find(t => t.id === req.technicianId);
    mockAppointments[idx] = {
      ...mockAppointments[idx],
      technicianId: req.technicianId,
      technicianName: tech?.name || req.technicianId,
      assignedAt: new Date().toISOString(),
      assignedBy: 'Admin',
      updatedAt: new Date().toISOString(),
    };
    mockTimeline.push({
      id: `e${nextId++}`, appointmentId: id, eventType: 'assigned',
      description: `Assigned to ${tech?.name || req.technicianId}`,
      actorName: 'Admin', actorRole: 'agent', timestamp: new Date().toISOString(),
    });
    return mockAppointments[idx];
  },

  async reschedule(id: string, req: RescheduleRequest): Promise<AppointmentDTO> {
    await delay(400);
    const idx = mockAppointments.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Appointment not found');
    const oldDate = mockAppointments[idx].date;
    const oldTimeSlot = mockAppointments[idx].timeSlot;
    mockAppointments[idx] = {
      ...mockAppointments[idx],
      date: req.newDate,
      timeSlot: req.newTimeSlot,
      status: AppointmentStatus.Rescheduled,
      reason: req.reason,
      rescheduledFrom: `${oldDate} ${oldTimeSlot}`,
      rescheduledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTimeline.push({
      id: `e${nextId++}`, appointmentId: id, eventType: 'rescheduled',
      description: `Rescheduled from ${oldDate} ${oldTimeSlot} to ${req.newDate} ${req.newTimeSlot}: ${req.reason}`,
      actorName: 'Admin', actorRole: 'agent', timestamp: new Date().toISOString(),
    });
    return mockAppointments[idx];
  },

  async cancel(id: string, req: CancelAppointmentRequest): Promise<void> {
    await delay(300);
    const idx = mockAppointments.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Appointment not found');
    mockAppointments[idx] = {
      ...mockAppointments[idx],
      status: AppointmentStatus.Cancelled,
      reason: req.reason,
      cancelledBy: req.cancelledBy,
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTimeline.push({
      id: `e${nextId++}`, appointmentId: id, eventType: 'cancelled',
      description: `Cancelled: ${req.reason}`,
      actorName: req.cancelledBy, actorRole: 'agent', timestamp: new Date().toISOString(),
    });
  },

  async complete(id: string, req: CompleteAppointmentRequest): Promise<void> {
    await delay(300);
    const idx = mockAppointments.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Appointment not found');
    mockAppointments[idx] = {
      ...mockAppointments[idx],
      status: AppointmentStatus.Completed,
      completedAt: new Date().toISOString(),
      completedNotes: req.notes,
      updatedAt: new Date().toISOString(),
    };
    mockTimeline.push({
      id: `e${nextId++}`, appointmentId: id, eventType: 'completed',
      description: `Service completed - ${req.notes}`,
      actorName: req.completedBy, actorRole: 'agent', timestamp: new Date().toISOString(),
    });
  },

  async listTechnicians(): Promise<TechnicianListResponse> {
    await delay(300);
    return { technicians: [...mockTechnicians], total: mockTechnicians.length };
  },

  async getTechnicianSchedule(id: string, date: string): Promise<TechnicianScheduleResponse> {
    await delay(400);
    const technician = mockTechnicians.find(t => t.id === id);
    if (!technician) throw new Error('Technician not found');
    const dayAppointments = mockAppointments.filter(a => a.technicianId === id && a.date === date);
    const slots = mockSlots.map(s => ({
      time: s.start,
      appointment: dayAppointments.find(a => a.timeSlot.startsWith(s.start)) || null,
    }));
    return { technician, date, slots };
  },

  async listServiceTypes(): Promise<ServiceTypeListResponse> {
    await delay(300);
    return { services: [...mockServiceTypes], total: mockServiceTypes.length };
  },

  async createServiceType(req: CreateServiceTypeRequest): Promise<ServiceTypeDTO> {
    await delay(400);
    const dto: ServiceTypeDTO = {
      id: `s${nextId++}`, ...req, category: req.category as ServiceCategory,
      requiredSkills: req.requiredSkills as TechnicianSkill[], isActive: true,
    };
    mockServiceTypes.push(dto);
    return dto;
  },

  async updateServiceType(id: string, req: UpdateServiceTypeRequest): Promise<ServiceTypeDTO> {
    await delay(300);
    const idx = mockServiceTypes.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Service type not found');
    mockServiceTypes[idx] = { ...mockServiceTypes[idx], ...req };
    return mockServiceTypes[idx];
  },

  async getAvailableSlots(date: string, serviceTypeId: string): Promise<AvailableSlotsResponse> {
    await delay(300);
    const existingAppointments = mockAppointments.filter(a => a.date === date && a.status !== AppointmentStatus.Cancelled);
    const slots = mockSlots.map(s => ({
      ...s,
      available: !existingAppointments.some(a => a.timeSlot.startsWith(s.start)),
    }));
    return { date, serviceTypeId, slots };
  },

  async getHistory(appointmentId: string): Promise<AppointmentHistoryResponse> {
    await delay(300);
    const events = mockTimeline.filter(e => e.appointmentId === appointmentId);
    return { events, total: events.length, page: 1, pageSize: 50 };
  },

  async getAllHistory(filters?: { dateFrom?: string; dateTo?: string; eventType?: string }): Promise<AppointmentHistoryResponse> {
    await delay(400);
    let filtered = [...mockTimeline];
    if (filters?.dateFrom) filtered = filtered.filter(e => e.timestamp >= filters.dateFrom!);
    if (filters?.dateTo) filtered = filtered.filter(e => e.timestamp <= filters.dateTo!);
    if (filters?.eventType) filtered = filtered.filter(e => e.eventType === filters.eventType);
    return { events: filtered, total: filtered.length, page: 1, pageSize: 50 };
  },

  async getDashboardStats(): Promise<DashboardStatsResponse> {
    await delay(300);
    const todayAppts = mockAppointments.filter(a => a.date === today);
    const stats: AppointmentStatsDTO = {
      totalToday: todayAppts.length,
      completedToday: todayAppts.filter(a => a.status === AppointmentStatus.Completed).length,
      pendingToday: todayAppts.filter(a => a.status === AppointmentStatus.Scheduled || a.status === AppointmentStatus.Confirmed).length,
      overdue: mockAppointments.filter(a => a.date < today && a.status !== AppointmentStatus.Completed && a.status !== AppointmentStatus.Cancelled).length,
      pendingAssignment: mockAppointments.filter(a => !a.technicianId).length,
      upcomingCount: mockAppointments.filter(a => a.date >= tomorrow).length,
      cancelledCount: mockAppointments.filter(a => a.status === AppointmentStatus.Cancelled).length,
      averageDuration: 90,
      onTimeRate: 85,
    };
    return { stats };
  },

  async getReport(req: GenerateReportRequest): Promise<ReportResponse> {
    await delay(500);
    const filtered = mockAppointments.filter(a => a.date >= req.dateFrom && a.date <= req.dateTo);
    const report: ReportStatsVM = {
      period: `${req.dateFrom} - ${req.dateTo}`,
      totalAppointments: filtered.length,
      completedAppointments: filtered.filter(a => a.status === AppointmentStatus.Completed).length,
      cancelledAppointments: filtered.filter(a => a.status === AppointmentStatus.Cancelled).length,
      noShowAppointments: filtered.filter(a => a.status === AppointmentStatus.NoShow).length,
      completionRate: filtered.length ? Math.round((filtered.filter(a => a.status === AppointmentStatus.Completed).length / filtered.length) * 100) : 0,
      cancellationRate: filtered.length ? Math.round((filtered.filter(a => a.status === AppointmentStatus.Cancelled).length / filtered.length) * 100) : 0,
      averageDuration: filtered.length ? Math.round(filtered.reduce((s, a) => s + a.durationMinutes, 0) / filtered.length) : 0,
      onTimeRate: 82,
      byStatus: [
        { status: 'Scheduled', count: filtered.filter(a => a.status === AppointmentStatus.Scheduled).length },
        { status: 'Confirmed', count: filtered.filter(a => a.status === AppointmentStatus.Confirmed).length },
        { status: 'In Progress', count: filtered.filter(a => a.status === AppointmentStatus.InProgress).length },
        { status: 'Completed', count: filtered.filter(a => a.status === AppointmentStatus.Completed).length },
        { status: 'Cancelled', count: filtered.filter(a => a.status === AppointmentStatus.Cancelled).length },
      ],
      byTechnician: mockTechnicians.map(t => ({
        name: t.name,
        count: filtered.filter(a => a.technicianId === t.id).length,
        completed: filtered.filter(a => a.technicianId === t.id && a.status === AppointmentStatus.Completed).length,
      })),
      byServiceType: mockServiceTypes.map(s => ({
        name: s.name,
        count: filtered.filter(a => a.serviceTypeId === s.id).length,
      })),
      dailyCounts: [...new Set(filtered.map(a => a.date))].sort().map(d => ({
        date: d,
        count: filtered.filter(a => a.date === d).length,
      })),
    };
    return { report };
  },

  async search(query: string): Promise<SearchResponse> {
    await delay(300);
    const q = query.toLowerCase();
    const results: SearchResultVM[] = [];
    mockAppointments.forEach(a => {
      if (a.customerName.toLowerCase().includes(q)) results.push({ type: 'appointment', id: a.id, title: a.customerName, subtitle: `${a.serviceTypeName} - ${a.date}`, matchField: 'customerName' });
      if (a.id.toLowerCase().includes(q)) results.push({ type: 'appointment', id: a.id, title: `#${a.id}`, subtitle: `${a.customerName} - ${a.serviceTypeName}`, matchField: 'id' });
      if (a.serviceTypeName.toLowerCase().includes(q)) results.push({ type: 'appointment', id: a.id, title: a.serviceTypeName, subtitle: `${a.customerName} - ${a.date}`, matchField: 'serviceTypeName' });
    });
    mockTechnicians.forEach(t => {
      if (t.name.toLowerCase().includes(q)) results.push({ type: 'technician', id: t.id, title: t.name, subtitle: `${t.skills.join(', ')}`, matchField: 'name' });
    });
    return { results: results.slice(0, 20), total: results.length };
  },
};
