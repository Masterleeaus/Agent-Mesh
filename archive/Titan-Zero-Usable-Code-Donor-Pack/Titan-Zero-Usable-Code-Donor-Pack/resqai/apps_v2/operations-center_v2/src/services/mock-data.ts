import type { OperationDTO, TechnicianDTO, DispatchDTO, EscalationDTO, TimelineEventDTO, RegionDTO } from '../models/dto';

export const mockOperations: OperationDTO[] = [
  { id: 'OP-1001', title: 'HVAC Repair - Johnson Residence', description: 'AC unit not cooling, refrigerant leak suspected', type: 'repair', priority: 'high', status: 'dispatched', customerId: 'C-001', customerName: 'Robert Johnson', customerAddress: '123 Oak St, Springfield, IL', customerPhone: '(217) 555-0101', technicianId: 'T-001', technicianName: 'Alex Chen', region: 'midwest', scheduledStart: '2026-06-30T09:00:00Z', scheduledEnd: '2026-06-30T12:00:00Z', estimatedDuration: 180, createdAt: '2026-06-29T14:00:00Z', updatedAt: '2026-06-30T07:30:00Z' },
  { id: 'OP-1002', title: 'Furnace Installation - Smith Property', description: 'New furnace installation for residential property', type: 'installation', priority: 'normal', status: 'pending_dispatch', customerId: 'C-002', customerName: 'Sarah Smith', customerAddress: '456 Maple Ave, Chicago, IL', customerPhone: '(312) 555-0202', region: 'midwest', scheduledStart: '2026-07-01T08:00:00Z', scheduledEnd: '2026-07-01T16:00:00Z', estimatedDuration: 480, createdAt: '2026-06-28T10:00:00Z', updatedAt: '2026-06-28T10:00:00Z' },
  { id: 'OP-1003', title: 'Electrical Panel Upgrade - Office Building', description: 'Upgrade main electrical panel to 400A service', type: 'repair', priority: 'critical', status: 'escalated', customerId: 'C-003', customerName: 'TechCorp Inc', customerAddress: '789 Business Blvd, New York, NY', customerPhone: '(212) 555-0303', region: 'northeast', scheduledStart: '2026-06-30T07:00:00Z', scheduledEnd: '2026-06-30T15:00:00Z', estimatedDuration: 480, escalationReason: 'Customer threatening legal action', escalatedTo: 'regional-manager', createdAt: '2026-06-27T08:00:00Z', updatedAt: '2026-06-30T06:00:00Z' },
  { id: 'OP-1004', title: 'Water Heater Maintenance - Park Hotel', description: 'Annual maintenance on 3 commercial water heaters', type: 'maintenance', priority: 'normal', status: 'in_progress', customerId: 'C-004', customerName: 'Park Hotel Group', customerAddress: '321 Lake Dr, Miami, FL', customerPhone: '(305) 555-0404', technicianId: 'T-002', technicianName: 'Maria Santos', region: 'southeast', scheduledStart: '2026-06-30T08:00:00Z', scheduledEnd: '2026-06-30T14:00:00Z', estimatedDuration: 360, actualStart: '2026-06-30T08:15:00Z', createdAt: '2026-06-25T09:00:00Z', updatedAt: '2026-06-30T08:15:00Z' },
  { id: 'OP-1005', title: 'Emergency Generator Repair - Hospital', description: 'Backup generator failure, emergency repair needed', type: 'emergency', priority: 'critical', status: 'dispatched', customerId: 'C-005', customerName: 'St Marys Hospital', customerAddress: '555 Health Dr, Dallas, TX', customerPhone: '(214) 555-0505', technicianId: 'T-003', technicianName: 'James Wilson', region: 'southwest', scheduledStart: '2026-06-30T06:00:00Z', scheduledEnd: '2026-06-30T10:00:00Z', estimatedDuration: 240, createdAt: '2026-06-30T05:30:00Z', updatedAt: '2026-06-30T05:45:00Z' },
  { id: 'OP-1006', title: 'AC Inspection - Residential', description: 'Pre-summer AC system inspection and tune-up', type: 'inspection', priority: 'low', status: 'pending_dispatch', customerId: 'C-006', customerName: 'Emily Davis', customerAddress: '777 Pine Rd, Denver, CO', customerPhone: '(303) 555-0606', region: 'west', scheduledStart: '2026-07-02T09:00:00Z', scheduledEnd: '2026-07-02T11:00:00Z', estimatedDuration: 120, createdAt: '2026-06-26T11:00:00Z', updatedAt: '2026-06-26T11:00:00Z' },
  { id: 'OP-1007', title: 'Roof Solar Panel Installation', description: 'Install 12kW solar panel system on residential roof', type: 'installation', priority: 'high', status: 'in_progress', customerId: 'C-007', customerName: 'Green Energy Homes', customerAddress: '999 Solar Way, Phoenix, AZ', customerPhone: '(602) 555-0707', technicianId: 'T-004', technicianName: 'David Kim', region: 'southwest', scheduledStart: '2026-06-29T07:00:00Z', scheduledEnd: '2026-07-01T17:00:00Z', estimatedDuration: 1800, actualStart: '2026-06-29T07:30:00Z', createdAt: '2026-06-20T08:00:00Z', updatedAt: '2026-06-30T09:00:00Z' },
  { id: 'OP-1008', title: 'Plumbing Leak Repair - Apartment Complex', description: 'Emergency water leak in unit 4B, needs immediate attention', type: 'emergency', priority: 'critical', status: 'on_hold', customerId: 'C-008', customerName: 'Riverside Apartments', customerAddress: '444 River Rd, Portland, OR', customerPhone: '(503) 555-0808', technicianId: 'T-005', technicianName: 'Lisa Park', region: 'west', scheduledStart: '2026-06-30T10:00:00Z', scheduledEnd: '2026-06-30T14:00:00Z', estimatedDuration: 240, notes: 'Waiting for parts delivery', createdAt: '2026-06-30T08:00:00Z', updatedAt: '2026-06-30T10:30:00Z' },
  { id: 'OP-1009', title: 'Commercial Refrigeration Repair', description: 'Walk-in freezer compressor failure at restaurant', type: 'repair', priority: 'high', status: 'dispatched', customerId: 'C-009', customerName: "Marco's Italian Restaurant", customerAddress: '222 Pasta Ln, Boston, MA', customerPhone: '(617) 555-0909', technicianId: 'T-001', technicianName: 'Alex Chen', region: 'northeast', scheduledStart: '2026-06-30T13:00:00Z', scheduledEnd: '2026-06-30T17:00:00Z', estimatedDuration: 240, createdAt: '2026-06-30T07:00:00Z', updatedAt: '2026-06-30T07:30:00Z', conflictWarning: 'Scheduling conflict detected with OP-1001' },
  { id: 'OP-1010', title: 'General Maintenance - Office Building', description: 'Routine HVAC and electrical maintenance', type: 'maintenance', priority: 'low', status: 'completed', customerId: 'C-010', customerName: 'Delta Office Park', customerAddress: '888 Commerce Ct, Atlanta, GA', customerPhone: '(404) 555-1010', technicianId: 'T-002', technicianName: 'Maria Santos', region: 'southeast', scheduledStart: '2026-06-29T08:00:00Z', scheduledEnd: '2026-06-29T16:00:00Z', estimatedDuration: 480, actualStart: '2026-06-29T08:00:00Z', actualEnd: '2026-06-29T15:45:00Z', completedAt: '2026-06-29T15:45:00Z', createdAt: '2026-06-24T10:00:00Z', updatedAt: '2026-06-29T15:45:00Z' },
  { id: 'OP-1011', title: 'Consultation - New Building Project', description: 'Site visit and consultation for new commercial building HVAC design', type: 'consultation', priority: 'normal', status: 'completed', customerId: 'C-011', customerName: 'BuildRight Construction', customerAddress: '111 Architect Dr, Seattle, WA', customerPhone: '(206) 555-1111', technicianId: 'T-004', technicianName: 'David Kim', region: 'west', scheduledStart: '2026-06-28T10:00:00Z', scheduledEnd: '2026-06-28T12:00:00Z', estimatedDuration: 120, actualStart: '2026-06-28T10:00:00Z', actualEnd: '2026-06-28T11:45:00Z', completedAt: '2026-06-28T11:45:00Z', createdAt: '2026-06-22T09:00:00Z', updatedAt: '2026-06-28T11:45:00Z' },
  { id: 'OP-1012', title: 'Filter Replacement - Retail Chain', description: 'Monthly filter replacement for 5 store locations', type: 'maintenance', priority: 'low', status: 'pending_dispatch', customerId: 'C-012', customerName: 'RetailMax Stores', customerAddress: '555 Market St, San Francisco, CA', customerPhone: '(415) 555-1212', region: 'west', scheduledStart: '2026-07-03T08:00:00Z', scheduledEnd: '2026-07-03T17:00:00Z', estimatedDuration: 540, createdAt: '2026-06-25T08:00:00Z', updatedAt: '2026-06-25T08:00:00Z' },
  { id: 'OP-1013', title: 'Emergency Boiler Repair - School', description: 'Boiler malfunction, no heating in main building', type: 'emergency', priority: 'critical', status: 'in_progress', customerId: 'C-013', customerName: 'Lincoln High School', customerAddress: '777 Education Ave, Columbus, OH', customerPhone: '(614) 555-1313', technicianId: 'T-003', technicianName: 'James Wilson', region: 'midwest', scheduledStart: '2026-06-30T08:00:00Z', scheduledEnd: '2026-06-30T16:00:00Z', estimatedDuration: 480, actualStart: '2026-06-30T08:30:00Z', createdAt: '2026-06-30T06:00:00Z', updatedAt: '2026-06-30T08:30:00Z' },
  { id: 'OP-1014', title: 'Smart Thermostat Installation', description: 'Install and configure 20 smart thermostats for office building', type: 'installation', priority: 'normal', status: 'pending_dispatch', customerId: 'C-014', customerName: 'EcoOffice Solutions', customerAddress: '333 Green Blvd, Austin, TX', customerPhone: '(512) 555-1414', region: 'southwest', scheduledStart: '2026-07-05T08:00:00Z', scheduledEnd: '2026-07-05T17:00:00Z', estimatedDuration: 540, createdAt: '2026-06-28T13:00:00Z', updatedAt: '2026-06-28T13:00:00Z' },
  { id: 'OP-1015', title: 'Cooling Tower Maintenance - Hospital', description: 'Quarterly cooling tower inspection and maintenance', type: 'maintenance', priority: 'high', status: 'pending_dispatch', customerId: 'C-005', customerName: 'St Marys Hospital', customerAddress: '555 Health Dr, Dallas, TX', customerPhone: '(214) 555-0505', region: 'southwest', scheduledStart: '2026-07-06T07:00:00Z', scheduledEnd: '2026-07-06T15:00:00Z', estimatedDuration: 480, createdAt: '2026-06-28T14:00:00Z', updatedAt: '2026-06-28T14:00:00Z' },
];

export const mockTechnicians: TechnicianDTO[] = [
  { id: 'T-001', name: 'Alex Chen', email: 'alex.chen@resqai.com', phone: '(555) 111-0001', status: 'en_route', region: 'northeast', skills: ['HVAC', 'Electrical', 'Refrigeration'], rating: 4.8, completedJobs: 342, isOnline: true, currentOperationId: 'OP-1001', lastLocationUpdate: '2026-06-30T07:45:00Z', createdAt: '2024-01-15T00:00:00Z' },
  { id: 'T-002', name: 'Maria Santos', email: 'maria.santos@resqai.com', phone: '(555) 111-0002', status: 'on_site', region: 'southeast', skills: ['Plumbing', 'HVAC', 'Maintenance'], rating: 4.9, completedJobs: 521, isOnline: true, currentOperationId: 'OP-1004', lastLocationUpdate: '2026-06-30T08:20:00Z', createdAt: '2023-06-01T00:00:00Z' },
  { id: 'T-003', name: 'James Wilson', email: 'james.wilson@resqai.com', phone: '(555) 111-0003', status: 'on_site', region: 'southwest', skills: ['Emergency Repair', 'Generator', 'Boilers', 'Electrical'], rating: 4.7, completedJobs: 289, isOnline: true, currentOperationId: 'OP-1013', lastLocationUpdate: '2026-06-30T08:35:00Z', createdAt: '2024-03-10T00:00:00Z' },
  { id: 'T-004', name: 'David Kim', email: 'david.kim@resqai.com', phone: '(555) 111-0004', status: 'on_site', region: 'west', skills: ['Solar', 'Electrical', 'HVAC', 'Consultation'], rating: 4.6, completedJobs: 198, isOnline: true, currentOperationId: 'OP-1007', lastLocationUpdate: '2026-06-30T09:05:00Z', createdAt: '2024-07-22T00:00:00Z' },
  { id: 'T-005', name: 'Lisa Park', email: 'lisa.park@resqai.com', phone: '(555) 111-0005', status: 'available', region: 'west', skills: ['Plumbing', 'Maintenance', 'Inspection'], rating: 4.5, completedJobs: 156, isOnline: true, createdAt: '2024-09-05T00:00:00Z' },
  { id: 'T-006', name: 'Mike Johnson', email: 'mike.johnson@resqai.com', phone: '(555) 111-0006', status: 'offline', region: 'midwest', skills: ['HVAC', 'Refrigeration', 'Electrical'], rating: 4.4, completedJobs: 412, isOnline: false, createdAt: '2023-11-20T00:00:00Z' },
  { id: 'T-007', name: 'Sarah Patel', email: 'sarah.patel@resqai.com', phone: '(555) 111-0007', status: 'on_break', region: 'northeast', skills: ['Installation', 'Maintenance', 'Consultation'], rating: 4.8, completedJobs: 267, isOnline: true, createdAt: '2024-02-14T00:00:00Z' },
  { id: 'T-008', name: 'Carlos Rivera', email: 'carlos.rivera@resqai.com', phone: '(555) 111-0008', status: 'available', region: 'southeast', skills: ['Plumbing', 'HVAC', 'Emergency Repair'], rating: 4.3, completedJobs: 134, isOnline: true, createdAt: '2025-01-10T00:00:00Z' },
];

export const mockDispatches: DispatchDTO[] = [
  { id: 'D-001', operationId: 'OP-1001', technicianId: 'T-001', technicianName: 'Alex Chen', method: 'auto', dispatchedBy: 'system', dispatchedAt: '2026-06-30T07:30:00Z', estimatedArrival: '2026-06-30T08:30:00Z', status: 'en_route' },
  { id: 'D-002', operationId: 'OP-1004', technicianId: 'T-002', technicianName: 'Maria Santos', method: 'manual', dispatchedBy: 'Marcus Kane', dispatchedAt: '2026-06-30T07:45:00Z', estimatedArrival: '2026-06-30T08:15:00Z', actualArrival: '2026-06-30T08:15:00Z', status: 'completed' },
  { id: 'D-003', operationId: 'OP-1005', technicianId: 'T-003', technicianName: 'James Wilson', method: 'auto', dispatchedBy: 'system', dispatchedAt: '2026-06-30T05:45:00Z', estimatedArrival: '2026-06-30T06:30:00Z', status: 'en_route' },
  { id: 'D-004', operationId: 'OP-1007', technicianId: 'T-004', technicianName: 'David Kim', method: 'scheduled', dispatchedBy: 'system', dispatchedAt: '2026-06-29T06:00:00Z', estimatedArrival: '2026-06-29T07:00:00Z', actualArrival: '2026-06-29T07:30:00Z', status: 'completed' },
  { id: 'D-005', operationId: 'OP-1008', technicianId: 'T-005', technicianName: 'Lisa Park', method: 'manual', dispatchedBy: 'Marcus Kane', dispatchedAt: '2026-06-30T09:30:00Z', estimatedArrival: '2026-06-30T10:00:00Z', status: 'completed' },
  { id: 'D-006', operationId: 'OP-1009', technicianId: 'T-001', technicianName: 'Alex Chen', method: 'auto', dispatchedBy: 'system', dispatchedAt: '2026-06-30T12:00:00Z', estimatedArrival: '2026-06-30T13:00:00Z', status: 'pending' },
  { id: 'D-007', operationId: 'OP-1013', technicianId: 'T-003', technicianName: 'James Wilson', method: 'auto', dispatchedBy: 'system', dispatchedAt: '2026-06-30T07:00:00Z', estimatedArrival: '2026-06-30T08:00:00Z', actualArrival: '2026-06-30T08:30:00Z', status: 'completed' },
];

export const mockEscalations: EscalationDTO[] = [
  { id: 'E-001', operationId: 'OP-1003', operationTitle: 'Electrical Panel Upgrade - Office Building', reason: 'Customer threatening legal action due to project delays', escalatedBy: 'Dispatcher', escalatedTo: 'regional-manager', status: 'open', priority: 'critical', createdAt: '2026-06-30T06:00:00Z' },
  { id: 'E-002', operationId: 'OP-1006', operationTitle: 'AC Inspection - Residential', reason: 'Customer requested expedited scheduling', escalatedBy: 'Agent', status: 'acknowledged', priority: 'low', createdAt: '2026-06-28T14:00:00Z', resolvedAt: '2026-06-29T10:00:00Z', resolution: 'Scheduled for July 2nd as requested' },
];

export const mockTimeline: TimelineEventDTO[] = [
  { id: 'TE-001', operationId: 'OP-1001', type: 'dispatch', description: 'Operation dispatched to Alex Chen', actorName: 'System', createdAt: '2026-06-30T07:30:00Z' },
  { id: 'TE-002', operationId: 'OP-1001', type: 'assignment', description: 'Alex Chen assigned as technician', actorName: 'System', createdAt: '2026-06-30T07:30:00Z' },
  { id: 'TE-003', operationId: 'OP-1001', type: 'status_change', description: 'Status changed from pending_dispatch to dispatched', actorName: 'System', createdAt: '2026-06-30T07:30:00Z' },
  { id: 'TE-004', operationId: 'OP-1003', type: 'escalation', description: 'Operation escalated - Customer threatening legal action', actorName: 'Dispatcher', createdAt: '2026-06-30T06:00:00Z' },
  { id: 'TE-005', operationId: 'OP-1004', type: 'status_change', description: 'Status changed from dispatched to in_progress', actorName: 'Maria Santos', createdAt: '2026-06-30T08:15:00Z' },
  { id: 'TE-006', operationId: 'OP-1004', type: 'note', description: 'Technician arrived on site', actorName: 'Maria Santos', createdAt: '2026-06-30T08:15:00Z' },
  { id: 'TE-007', operationId: 'OP-1005', type: 'dispatch', description: 'Emergency dispatch to James Wilson', actorName: 'System', createdAt: '2026-06-30T05:45:00Z' },
  { id: 'TE-008', operationId: 'OP-1008', type: 'conflict', description: 'Parts not available - operation on hold', actorName: 'Lisa Park', createdAt: '2026-06-30T10:30:00Z' },
  { id: 'TE-009', operationId: 'OP-1009', type: 'conflict', description: 'Scheduling conflict detected with OP-1001', actorName: 'System', createdAt: '2026-06-30T12:00:00Z' },
  { id: 'TE-010', operationId: 'OP-1010', type: 'completion', description: 'Operation completed successfully', actorName: 'Maria Santos', createdAt: '2026-06-29T15:45:00Z' },
  { id: 'TE-011', operationId: 'OP-1011', type: 'completion', description: 'Consultation completed - report submitted', actorName: 'David Kim', createdAt: '2026-06-28T11:45:00Z' },
  { id: 'TE-012', operationId: 'OP-1013', type: 'dispatch', description: 'Emergency dispatch to James Wilson', actorName: 'System', createdAt: '2026-06-30T07:00:00Z' },
  { id: 'TE-013', operationId: 'OP-1013', type: 'status_change', description: 'Status changed from dispatched to in_progress', actorName: 'James Wilson', createdAt: '2026-06-30T08:30:00Z' },
];

export const mockRegions: RegionDTO[] = [
  { id: 'northeast', name: 'Northeast', activeTechnicians: 2, pendingOperations: 0, inProgressOperations: 1, completedToday: 0, color: '#41d1c4' },
  { id: 'southeast', name: 'Southeast', activeTechnicians: 2, pendingOperations: 0, inProgressOperations: 1, completedToday: 1, color: '#60a5fa' },
  { id: 'midwest', name: 'Midwest', activeTechnicians: 1, pendingOperations: 0, inProgressOperations: 1, completedToday: 0, color: '#a78bfa' },
  { id: 'southwest', name: 'Southwest', activeTechnicians: 2, pendingOperations: 3, inProgressOperations: 1, completedToday: 0, color: '#f59e0b' },
  { id: 'west', name: 'West', activeTechnicians: 2, pendingOperations: 1, inProgressOperations: 1, completedToday: 0, color: '#4ade80' },
];

export const mockDashboardMetrics = {
  activeTickets: 8,
  activeTicketsChange: 12,
  activeTechnicians: 6,
  activeTechniciansChange: -5,
  pendingDispatch: 5,
  pendingDispatchChange: 25,
  highPriority: 4,
  highPriorityChange: 33,
  overdueJobs: 2,
  overdueJobsChange: -10,
  completedToday: 0,
  completedTodayChange: 0,
};

export const mockLiveMetrics = [
  { label: 'Avg Response Time', value: 18, unit: 'min', trend: 'down' as const, changePercent: 12 },
  { label: 'Avg Completion Time', value: 3.5, unit: 'hrs', trend: 'down' as const, changePercent: 8 },
  { label: 'First-Time Fix Rate', value: 87, unit: '%', trend: 'up' as const, changePercent: 3 },
  { label: 'Customer Satisfaction', value: 4.6, unit: '/5', trend: 'up' as const, changePercent: 2 },
  { label: 'On-Time Arrival', value: 76, unit: '%', trend: 'down' as const, changePercent: 5 },
  { label: 'Idle Time', value: 12, unit: '%', trend: 'stable' as const, changePercent: 0 },
];
