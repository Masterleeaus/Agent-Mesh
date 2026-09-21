import type { JobDTO, CustomerDTO, TechnicianDTO, ChecklistDTO, ChecklistItemDTO, ServiceNoteDTO, PartDTO, EvidenceDTO, SignatureDTO, MessageDTO, NotificationDTO, TimelineEventDTO } from '../models/dto';

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
const hoursAhead = (h: number) => new Date(now.getTime() + h * 3600000).toISOString();

export const mockCustomers: CustomerDTO[] = [
  { id: 'cust-001', name: 'Alice Johnson', phone: '+1-555-0101', email: 'alice@example.com', address: '123 Oak St', city: 'Springfield', state: 'IL', zip: '62701', accountName: 'Johnson Residence', preferredContact: 'phone', createdAt: daysAgo(120) },
  { id: 'cust-002', name: 'Bob Smith', phone: '+1-555-0102', email: 'bob@example.com', address: '456 Maple Ave', city: 'Springfield', state: 'IL', zip: '62702', accountName: 'Smith Properties', preferredContact: 'email', createdAt: daysAgo(90) },
  { id: 'cust-003', name: 'Carol Davis', phone: '+1-555-0103', email: 'carol@example.com', address: '789 Pine Rd', city: 'Lincoln', state: 'IL', zip: '62656', preferredContact: 'sms', createdAt: daysAgo(60) },
  { id: 'cust-004', name: 'Dan Wilson', phone: '+1-555-0104', email: 'dan@example.com', address: '321 Elm St', city: 'Springfield', state: 'IL', zip: '62701', accountName: 'Wilson LLC', preferredContact: 'phone', createdAt: daysAgo(45) },
  { id: 'cust-005', name: 'Eve Martinez', phone: '+1-555-0105', email: 'eve@example.com', address: '654 Birch Ln', city: 'Decatur', state: 'IL', zip: '62521', preferredContact: 'email', createdAt: daysAgo(30) },
  { id: 'cust-006', name: 'Frank Lee', phone: '+1-555-0106', email: 'frank@example.com', address: '987 Cedar Dr', city: 'Springfield', state: 'IL', zip: '62704', accountName: 'Lee Holdings', preferredContact: 'phone', createdAt: daysAgo(20) },
  { id: 'cust-007', name: 'Grace Kim', phone: '+1-555-0107', email: 'grace@example.com', address: '147 Walnut Ct', city: 'Bloomington', state: 'IL', zip: '61701', preferredContact: 'sms', createdAt: daysAgo(15) },
  { id: 'cust-008', name: 'Henry Brown', phone: '+1-555-0108', email: 'henry@example.com', address: '258 Spruce Ave', city: 'Springfield', state: 'IL', zip: '62703', accountName: 'Brown & Co', preferredContact: 'email', createdAt: daysAgo(10) },
];

export const mockTechnicians: TechnicianDTO[] = [
  { id: 'tech-001', name: 'Marcus Rivera', email: 'marcus@resqai.com', phone: '+1-555-9001', role: 'senior_technician', isOnline: true, skills: ['HVAC', 'Electrical', 'Plumbing'], certifications: ['EPA 608', 'NATE'] },
  { id: 'tech-002', name: 'Jenna Walsh', email: 'jenna@resqai.com', phone: '+1-555-9002', role: 'technician', isOnline: true, skills: ['HVAC', 'Refrigeration'], certifications: ['EPA 608'] },
  { id: 'tech-003', name: 'Derek Chen', email: 'derek@resqai.com', phone: '+1-555-9003', role: 'technician', isOnline: false, skills: ['Plumbing', 'General'], certifications: [] },
  { id: 'tech-004', name: 'Sofia Patel', email: 'sofia@resqai.com', phone: '+1-555-9004', role: 'senior_technician', isOnline: true, skills: ['Electrical', 'HVAC', 'Controls'], certifications: ['EPA 608', 'NATE', 'Licensed Electrician'] },
  { id: 'tech-005', name: 'Omar Hassan', email: 'omar@resqai.com', phone: '+1-555-9005', role: 'technician', isOnline: true, skills: ['Appliance Repair', 'General'], certifications: [] },
];

const todayStr = now.toISOString().split('T')[0];

export const mockJobs: JobDTO[] = [
  {
    id: 'job-001', appointmentId: 'apt-001', customerId: 'cust-001', customerName: 'Alice Johnson',
    customerPhone: '+1-555-0101', customerEmail: 'alice@example.com',
    customerAddress: '123 Oak St', customerCity: 'Springfield', customerState: 'IL', customerZip: '62701',
    serviceType: 'repair', priority: 'high', status: 'assigned',
    title: 'AC Unit Not Cooling', description: 'Customer reports AC unit blowing warm air. Thermostat settings confirmed correct.',
    scheduledDate: todayStr, scheduledStart: `${todayStr}T08:00:00.000Z`, scheduledEnd: `${todayStr}T10:00:00.000Z`,
    estimatedDuration: 120, technicianId: 'tech-001', technicianName: 'Marcus Rivera',
    checklistId: 'cl-001', latitude: 39.7817, longitude: -89.6501,
    travelDistance: 12.4, travelDuration: 22,
    createdAt: daysAgo(1), updatedAt: hoursAgo(2),
  },
  {
    id: 'job-002', appointmentId: 'apt-002', customerId: 'cust-002', customerName: 'Bob Smith',
    customerPhone: '+1-555-0102', customerEmail: 'bob@example.com',
    customerAddress: '456 Maple Ave', customerCity: 'Springfield', customerState: 'IL', customerZip: '62702',
    serviceType: 'maintenance', priority: 'normal', status: 'assigned',
    title: 'Annual HVAC Maintenance', description: 'Scheduled annual maintenance for HVAC system. Includes filter replacement, coil cleaning, and system performance check.',
    scheduledDate: todayStr, scheduledStart: `${todayStr}T10:30:00.000Z`, scheduledEnd: `${todayStr}T12:00:00.000Z`,
    estimatedDuration: 90, technicianId: 'tech-001', technicianName: 'Marcus Rivera',
    checklistId: 'cl-002', latitude: 39.7832, longitude: -89.6523,
    travelDistance: 3.2, travelDuration: 8,
    createdAt: daysAgo(5), updatedAt: hoursAgo(1),
  },
  {
    id: 'job-003', appointmentId: 'apt-003', customerId: 'cust-003', customerName: 'Carol Davis',
    customerPhone: '+1-555-0103', customerEmail: 'carol@example.com',
    customerAddress: '789 Pine Rd', customerCity: 'Lincoln', customerState: 'IL', customerZip: '62656',
    serviceType: 'installation', priority: 'normal', status: 'assigned',
    title: 'New Thermostat Installation', description: 'Install new smart thermostat. Customer purchased a Nest Learning Thermostat and needs professional installation.',
    scheduledDate: todayStr, scheduledStart: `${todayStr}T13:00:00.000Z`, scheduledEnd: `${todayStr}T14:30:00.000Z`,
    estimatedDuration: 90, technicianId: 'tech-001', technicianName: 'Marcus Rivera',
    checklistId: 'cl-003', latitude: 40.1483, longitude: -89.3646,
    travelDistance: 28.1, travelDuration: 35,
    createdAt: daysAgo(3), updatedAt: hoursAgo(1),
  },
  {
    id: 'job-004', appointmentId: 'apt-004', customerId: 'cust-004', customerName: 'Dan Wilson',
    customerPhone: '+1-555-0104', customerEmail: 'dan@example.com',
    customerAddress: '321 Elm St', customerCity: 'Springfield', customerState: 'IL', customerZip: '62701',
    serviceType: 'emergency', priority: 'urgent', status: 'assigned',
    title: 'Water Heater Leaking - Emergency', description: 'Water heater leaking onto basement floor. Standing water reported. Emergency dispatch needed.',
    scheduledDate: todayStr, scheduledStart: `${todayStr}T07:30:00.000Z`, scheduledEnd: `${todayStr}T09:00:00.000Z`,
    estimatedDuration: 90, technicianId: 'tech-001', technicianName: 'Marcus Rivera',
    checklistId: 'cl-004', latitude: 39.7805, longitude: -89.6498,
    travelDistance: 5.1, travelDuration: 12,
    createdAt: daysAgo(0), updatedAt: hoursAgo(0.5),
  },
  {
    id: 'job-005', appointmentId: 'apt-005', customerId: 'cust-005', customerName: 'Eve Martinez',
    customerPhone: '+1-555-0105', customerEmail: 'eve@example.com',
    customerAddress: '654 Birch Ln', customerCity: 'Decatur', customerState: 'IL', customerZip: '62521',
    serviceType: 'repair', priority: 'normal', status: 'assigned',
    title: 'Dishwasher Noise Issue', description: 'Dishwasher making grinding noise during cycle. Previous repair did not resolve the issue. Follow-up visit required.',
    scheduledDate: todayStr, scheduledStart: `${todayStr}T15:00:00.000Z`, scheduledEnd: `${todayStr}T16:30:00.000Z`,
    estimatedDuration: 90, technicianId: 'tech-001', technicianName: 'Marcus Rivera',
    checklistId: 'cl-005', latitude: 39.8403, longitude: -88.9548,
    travelDistance: 35.6, travelDuration: 40,
    createdAt: daysAgo(2), updatedAt: hoursAgo(6),
  },
  {
    id: 'job-006', appointmentId: 'apt-006', customerId: 'cust-006', customerName: 'Frank Lee',
    customerPhone: '+1-555-0106', customerEmail: 'frank@example.com',
    customerAddress: '987 Cedar Dr', customerCity: 'Springfield', customerState: 'IL', customerZip: '62704',
    serviceType: 'inspection', priority: 'low', status: 'assigned',
    title: 'Pre-purchase HVAC Inspection', description: 'Home buyer requesting full HVAC system inspection for property under contract.',
    scheduledDate: daysAgo(-1).split('T')[0], scheduledStart: `${daysAgo(-1).split('T')[0]}T09:00:00.000Z`,
    scheduledEnd: `${daysAgo(-1).split('T')[0]}T10:30:00.000Z`,
    estimatedDuration: 90, technicianId: 'tech-001', technicianName: 'Marcus Rivera',
    checklistId: 'cl-009',
    createdAt: daysAgo(7), updatedAt: daysAgo(1),
  },
  {
    id: 'job-007', appointmentId: 'apt-007', customerId: 'cust-007', customerName: 'Grace Kim',
    customerPhone: '+1-555-0107', customerEmail: 'grace@example.com',
    customerAddress: '147 Walnut Ct', customerCity: 'Bloomington', customerState: 'IL', customerZip: '61701',
    serviceType: 'repair', priority: 'high', status: 'in_progress',
    title: 'Furnace Not Igniting', description: 'Furnace blower runs but burner does not ignite. Possible ignitor or gas valve issue.',
    scheduledDate: todayStr, scheduledStart: `${todayStr}T08:30:00.000Z`, scheduledEnd: `${todayStr}T11:00:00.000Z`,
    estimatedDuration: 150, technicianId: 'tech-002', technicianName: 'Jenna Walsh',
    checklistId: 'cl-006', latitude: 40.4842, longitude: -88.9937,
    travelDistance: 0, travelDuration: 0,
    createdAt: daysAgo(1), updatedAt: hoursAgo(1),
  },
  {
    id: 'job-008', appointmentId: 'apt-008', customerId: 'cust-008', customerName: 'Henry Brown',
    customerPhone: '+1-555-0108', customerEmail: 'henry@example.com',
    customerAddress: '258 Spruce Ave', customerCity: 'Springfield', customerState: 'IL', customerZip: '62703',
    serviceType: 'installation', priority: 'normal', status: 'completed',
    title: 'Water Softener Installation', description: 'Install water softener system in basement. Customer provided unit, needs connection to main water line and drain.',
    scheduledDate: daysAgo(1).split('T')[0], scheduledStart: `${daysAgo(1).split('T')[0]}T09:00:00.000Z`,
    scheduledEnd: `${daysAgo(1).split('T')[0]}T11:30:00.000Z`,
    estimatedDuration: 150, technicianId: 'tech-001', technicianName: 'Marcus Rivera',
    checklistId: 'cl-008', completedAt: daysAgo(1), completionNotes: 'Installation complete. Unit tested and functioning properly. Customer trained on controls.',
    createdAt: daysAgo(7), updatedAt: daysAgo(1),
  },
  {
    id: 'job-009', appointmentId: 'apt-009', customerId: 'cust-001', customerName: 'Alice Johnson',
    customerPhone: '+1-555-0101', customerEmail: 'alice@example.com',
    customerAddress: '123 Oak St', customerCity: 'Springfield', customerState: 'IL', customerZip: '62701',
    serviceType: 'follow_up', priority: 'normal', status: 'completed',
    title: 'AC Repair Follow-up', description: 'Follow-up visit to verify AC repair was successful. Customer reported issue resolved but wants confirmation.',
    scheduledDate: daysAgo(3).split('T')[0], scheduledStart: `${daysAgo(3).split('T')[0]}T14:00:00.000Z`,
    scheduledEnd: `${daysAgo(3).split('T')[0]}T15:00:00.000Z`,
    estimatedDuration: 60, technicianId: 'tech-001', technicianName: 'Marcus Rivera',
    completedAt: daysAgo(3), completionNotes: 'AC functioning properly. Temperature differential measured at 18°F. Customer satisfied.',
    createdAt: daysAgo(10), updatedAt: daysAgo(3),
  },
  {
    id: 'job-010', appointmentId: 'apt-010', customerId: 'cust-003', customerName: 'Carol Davis',
    customerPhone: '+1-555-0103', customerEmail: 'carol@example.com',
    customerAddress: '789 Pine Rd', customerCity: 'Lincoln', customerState: 'IL', customerZip: '62656',
    serviceType: 'emergency', priority: 'urgent', status: 'escalated',
    title: 'Refrigerator Failure - Food Spoilage Risk', description: 'Refrigerator stopped cooling. Light is on but compressor not running. Under extended warranty.',
    scheduledDate: todayStr, scheduledStart: `${todayStr}T06:00:00.000Z`, scheduledEnd: `${todayStr}T08:00:00.000Z`,
    estimatedDuration: 120, technicianId: 'tech-004', technicianName: 'Sofia Patel',
    checklisztId: 'cl-007', latitude: 40.1483, longitude: -89.3646,
    escalationReason: 'Food spoilage risk - customer needs priority service', escalatedTo: 'Operations Manager',
    createdAt: hoursAgo(3), updatedAt: hoursAgo(1),
  },
];

export const mockChecklists: Record<string, ChecklistDTO> = {
  'cl-001': {
    id: 'cl-001', jobId: 'job-001', name: 'AC Repair Checklist',
    items: [
      { id: 'cli-001', checklistId: 'cl-001', label: 'Verify thermostat settings', required: true, order: 1, completed: false },
      { id: 'cli-002', checklistId: 'cl-001', label: 'Check air filter condition', required: true, order: 2, completed: false },
      { id: 'cli-003', checklistId: 'cl-001', label: 'Inspect condenser unit', required: true, order: 3, completed: false },
      { id: 'cli-004', checklistId: 'cl-001', label: 'Check refrigerant levels', required: true, order: 4, completed: false },
      { id: 'cli-005', checklistId: 'cl-001', label: 'Test system operation', required: true, order: 5, completed: false },
      { id: 'cli-006', checklistId: 'cl-001', label: 'Measure temperature differential', required: false, order: 6, completed: false },
    ],
  },
  'cl-002': {
    id: 'cl-002', jobId: 'job-002', name: 'HVAC Maintenance Checklist',
    items: [
      { id: 'cli-007', checklistId: 'cl-002', label: 'Replace air filters', required: true, order: 1, completed: false },
      { id: 'cli-008', checklistId: 'cl-002', label: 'Clean evaporator coils', required: true, order: 2, completed: false },
      { id: 'cli-009', checklistId: 'cl-002', label: 'Clean condenser coils', required: true, order: 3, completed: false },
      { id: 'cli-010', checklistId: 'cl-002', label: 'Check refrigerant charge', required: true, order: 4, completed: false },
      { id: 'cli-011', checklistId: 'cl-002', label: 'Inspect electrical connections', required: true, order: 5, completed: false },
      { id: 'cli-012', checklistId: 'cl-002', label: 'Lubricate moving parts', required: false, order: 6, completed: false },
      { id: 'cli-013', checklistId: 'cl-002', label: 'Test safety controls', required: true, order: 7, completed: false },
    ],
  },
  'cl-003': {
    id: 'cl-003', jobId: 'job-003', name: 'Thermostat Installation Checklist',
    items: [
      { id: 'cli-014', checklistId: 'cl-003', label: 'Power off HVAC system', required: true, order: 1, completed: false },
      { id: 'cli-015', checklistId: 'cl-003', label: 'Remove old thermostat', required: true, order: 2, completed: false },
      { id: 'cli-016', checklistId: 'cl-003', label: 'Label and disconnect wires', required: true, order: 3, completed: false },
      { id: 'cli-017', checklistId: 'cl-003', label: 'Mount new thermostat base', required: true, order: 4, completed: false },
      { id: 'cli-018', checklistId: 'cl-003', label: 'Connect wires to correct terminals', required: true, order: 5, completed: false },
      { id: 'cli-019', checklistId: 'cl-003', label: 'Power on and configure', required: true, order: 6, completed: false },
      { id: 'cli-020', checklistId: 'cl-003', label: 'Connect to WiFi and app', required: false, order: 7, completed: false },
    ],
  },
  'cl-004': {
    id: 'cl-004', jobId: 'job-004', name: 'Water Heater Emergency Checklist',
    items: [
      { id: 'cli-021', checklistId: 'cl-004', label: 'Shut off water supply', required: true, order: 1, completed: false },
      { id: 'cli-022', checklistId: 'cl-004', label: 'Shut off power/gas to unit', required: true, order: 2, completed: false },
      { id: 'cli-023', checklistId: 'cl-004', label: 'Inspect leak source', required: true, order: 3, completed: false },
      { id: 'cli-024', checklistId: 'cl-004', label: 'Assess if repair or replacement needed', required: true, order: 4, completed: false },
      { id: 'cli-025', checklistId: 'cl-004', label: 'Document damage with photos', required: true, order: 5, completed: false },
    ],
  },
  'cl-005': {
    id: 'cl-005', jobId: 'job-005', name: 'Dishwasher Noise Diagnosis',
    items: [
      { id: 'cli-026', checklistId: 'cl-005', label: 'Run diagnostic cycle', required: true, order: 1, completed: false },
      { id: 'cli-027', checklistId: 'cl-005', label: 'Inspect wash arms for blockage', required: true, order: 2, completed: false },
      { id: 'cli-028', checklistId: 'cl-005', label: 'Check drain pump for debris', required: true, order: 3, completed: false },
      { id: 'cli-029', checklistId: 'cl-005', label: 'Inspect motor bearings', required: true, order: 4, completed: false },
      { id: 'cli-030', checklistId: 'cl-005', label: 'Test noise level after service', required: false, order: 5, completed: false },
    ],
  },
  'cl-006': {
    id: 'cl-006', jobId: 'job-007', name: 'Furnace Repair Checklist',
    items: [
      { id: 'cli-031', checklistId: 'cl-006', label: 'Check thermostat signal', required: true, order: 1, completed: true, completedAt: hoursAgo(0.8) },
      { id: 'cli-032', checklistId: 'cl-006', label: 'Inspect ignitor', required: true, order: 2, completed: true, completedAt: hoursAgo(0.5) },
      { id: 'cli-033', checklistId: 'cl-006', label: 'Check gas valve operation', required: true, order: 3, completed: false },
      { id: 'cli-034', checklistId: 'cl-006', label: 'Verify flame sensor', required: true, order: 4, completed: false },
      { id: 'cli-035', checklistId: 'cl-006', label: 'Test limit switches', required: true, order: 5, completed: false },
      { id: 'cli-036', checklistId: 'cl-006', label: 'Test full heating cycle', required: true, order: 6, completed: false },
    ],
  },
  'cl-008': {
    id: 'cl-008', jobId: 'job-008', name: 'Water Softener Installation Checklist',
    items: [
      { id: 'cli-037', checklistId: 'cl-008', label: 'Identify installation location', required: true, order: 1, completed: true, completedAt: daysAgo(1) },
      { id: 'cli-038', checklistId: 'cl-008', label: 'Shut off main water supply', required: true, order: 2, completed: true, completedAt: daysAgo(1) },
      { id: 'cli-039', checklistId: 'cl-008', label: 'Cut and prepare pipes', required: true, order: 3, completed: true, completedAt: daysAgo(1) },
      { id: 'cli-040', checklistId: 'cl-008', label: 'Install bypass valve', required: true, order: 4, completed: true, completedAt: daysAgo(1) },
      { id: 'cli-041', checklistId: 'cl-008', label: 'Connect unit to water line', required: true, order: 5, completed: true, completedAt: daysAgo(1) },
      { id: 'cli-042', checklistId: 'cl-008', label: 'Connect drain line', required: true, order: 6, completed: true, completedAt: daysAgo(1) },
      { id: 'cli-043', checklistId: 'cl-008', label: 'Power on and configure settings', required: true, order: 7, completed: true, completedAt: daysAgo(1) },
      { id: 'cli-044', checklistId: 'cl-008', label: 'Test operation and check for leaks', required: true, order: 8, completed: true, completedAt: daysAgo(1) },
    ],
  },
  'cl-009': {
    id: 'cl-009', jobId: 'job-006', name: 'HVAC Inspection Checklist',
    items: [
      { id: 'cli-045', checklistId: 'cl-009', label: 'Inspect indoor unit condition', required: true, order: 1, completed: true, completedAt: daysAgo(1) },
      { id: 'cli-046', checklistId: 'cl-009', label: 'Inspect outdoor unit condition', required: true, order: 2, completed: true, completedAt: daysAgo(1) },
      { id: 'cli-047', checklistId: 'cl-009', label: 'Check refrigerant charge', required: true, order: 3, completed: true, completedAt: daysAgo(1) },
      { id: 'cli-048', checklistId: 'cl-009', label: 'Measure airflow', required: true, order: 4, completed: true, completedAt: daysAgo(1) },
      { id: 'cli-049', checklistId: 'cl-009', label: 'Check electrical connections', required: true, order: 5, completed: true, completedAt: daysAgo(1) },
      { id: 'cli-050', checklistId: 'cl-009', label: 'Document system age and model', required: true, order: 6, completed: true, completedAt: daysAgo(1) },
    ],
  },
};

export const mockServiceNotes: Record<string, ServiceNoteDTO[]> = {
  'job-001': [
    { id: 'note-001', jobId: 'job-001', technicianId: 'tech-001', technicianName: 'Marcus Rivera', content: 'Customer reports AC stopped working overnight. Warm air from vents.', category: 'observation', createdAt: hoursAgo(0) },
  ],
  'job-007': [
    { id: 'note-002', jobId: 'job-007', technicianId: 'tech-002', technicianName: 'Jenna Walsh', content: 'Ignitor glows but does not get hot enough to ignite gas. Possible weak ignitor.', category: 'diagnosis', createdAt: hoursAgo(0.8) },
    { id: 'note-003', jobId: 'job-007', technicianId: 'tech-002', technicianName: 'Jenna Walsh', content: 'Replaced ignitor. Gas valve opens and burner lights successfully.', category: 'resolution', createdAt: hoursAgo(0.3) },
  ],
  'job-008': [
    { id: 'note-004', jobId: 'job-008', technicianId: 'tech-001', technicianName: 'Marcus Rivera', content: 'Installation location suitable. Main water line accessible. Existing pipes are copper - no issues.', category: 'observation', createdAt: daysAgo(1) },
    { id: 'note-005', jobId: 'job-008', technicianId: 'tech-001', technicianName: 'Marcus Rivera', content: 'Installation complete. Water pressure tested at 55 PSI. Unit regenerating properly.', category: 'resolution', createdAt: daysAgo(1) },
  ],
  'job-004': [
    { id: 'note-006', jobId: 'job-004', technicianId: 'tech-001', technicianName: 'Marcus Rivera', content: 'Emergency call - water heater leaking. Customer reports standing water in basement.', category: 'observation', createdAt: hoursAgo(0.5) },
  ],
};

export const mockParts: Record<string, PartDTO[]> = {
  'job-007': [
    { id: 'part-001', jobId: 'job-007', name: 'Ignitor Assembly', sku: 'IGN-2024-X1', quantity: 1, unitPrice: 45.00, totalPrice: 45.00, category: 'electrical', usedAt: hoursAgo(0.5) },
    { id: 'part-002', jobId: 'job-007', name: 'High Temp Silicone Tubing', sku: 'TUB-SIL-18', quantity: 0.5, unitPrice: 12.00, totalPrice: 6.00, category: 'general', usedAt: hoursAgo(0.5) },
  ],
  'job-008': [
    { id: 'part-003', jobId: 'job-008', name: 'Compression Fitting 3/4"', sku: 'CP-34-BR', quantity: 2, unitPrice: 8.50, totalPrice: 17.00, category: 'plumbing', usedAt: daysAgo(1) },
    { id: 'part-004', jobId: 'job-008', name: 'Drain Hose Kit', sku: 'DHK-100', quantity: 1, unitPrice: 15.00, totalPrice: 15.00, category: 'plumbing', usedAt: daysAgo(1) },
    { id: 'part-005', jobId: 'job-008', name: 'Brass Ball Valve 3/4"', sku: 'BV-34-BR', quantity: 1, unitPrice: 22.00, totalPrice: 22.00, category: 'plumbing', usedAt: daysAgo(1) },
    { id: 'part-006', jobId: 'job-008', name: 'Teflon Tape', sku: 'TT-100', quantity: 1, unitPrice: 3.50, totalPrice: 3.50, category: 'general', usedAt: daysAgo(1) },
  ],
};

export const mockEvidence: Record<string, EvidenceDTO[]> = {
  'job-007': [
    { id: 'ev-001', jobId: 'job-007', type: 'photo', url: '/mock/ev/furnace-before.jpg', thumbnailUrl: '/mock/ev/furnace-before-thumb.jpg', fileName: 'furnace-before.jpg', fileSize: 2457600, mimeType: 'image/jpeg', caption: 'Furnace interior before repair', latitude: 40.4842, longitude: -88.9937, createdAt: hoursAgo(0.7) },
    { id: 'ev-002', jobId: 'job-007', type: 'photo', url: '/mock/ev/ignitor-old.jpg', thumbnailUrl: '/mock/ev/ignitor-old-thumb.jpg', fileName: 'ignitor-old.jpg', fileSize: 1843200, mimeType: 'image/jpeg', caption: 'Old ignitor - visibly cracked', createdAt: hoursAgo(0.5) },
    { id: 'ev-003', jobId: 'job-007', type: 'photo', fileName: 'flame-test.mp4', fileSize: 5242880, mimeType: 'video/mp4', caption: 'Flame test after ignitor replacement', createdAt: hoursAgo(0.2) },
  ],
  'job-008': [
    { id: 'ev-004', jobId: 'job-008', type: 'photo', url: '/mock/ev/softener-installed.jpg', thumbnailUrl: '/mock/ev/softener-installed-thumb.jpg', fileName: 'softener-installed.jpg', fileSize: 3145728, mimeType: 'image/jpeg', caption: 'Water softener installed and operational', createdAt: daysAgo(1) },
  ],
};

export const mockSignatures: Record<string, SignatureDTO> = {
  'job-008': { id: 'sig-001', jobId: 'job-008', data: 'data:image/png;base64,mock_signature_data', customerName: 'Henry Brown', signedAt: daysAgo(1), createdAt: daysAgo(1) },
};

export const mockMessages: Record<string, MessageDTO[]> = {
  'job-001': [
    { id: 'msg-001', jobId: 'job-001', senderId: 'disp-001', senderName: 'Operations Desk', senderRole: 'dispatcher', body: 'Alice called to confirm you are coming this morning. She will be home.', read: true, createdAt: hoursAgo(3) },
  ],
  'job-004': [
    { id: 'msg-002', jobId: 'job-004', senderId: 'ops-001', senderName: 'Tom Rivera', senderRole: 'operations', body: 'This is an emergency call. Customer has standing water. Please proceed directly and update me on arrival.', read: true, createdAt: hoursAgo(1) },
    { id: 'msg-003', jobId: 'job-004', senderId: 'tech-001', senderName: 'Marcus Rivera', senderRole: 'technician', body: 'Copy that. En route now. ETA 12 minutes.', read: true, createdAt: hoursAgo(0.8) },
  ],
  'job-007': [
    { id: 'msg-004', jobId: 'job-007', senderId: 'disp-001', senderName: 'Operations Desk', senderRole: 'dispatcher', body: 'Grace called - she said the back door is unlocked if no one answers.', read: true, createdAt: hoursAgo(2) },
    { id: 'msg-005', jobId: 'job-007', senderId: 'tech-002', senderName: 'Jenna Walsh', senderRole: 'technician', body: 'Arrived on site. Furnace located in basement. Starting diagnosis now.', read: true, createdAt: hoursAgo(1) },
    { id: 'msg-006', jobId: 'job-007', senderId: 'tech-002', senderName: 'Jenna Walsh', senderRole: 'technician', body: 'Found the issue - ignitor is cracked. Need replacement part from truck.', read: false, createdAt: hoursAgo(0.7) },
    { id: 'msg-007', jobId: 'job-007', senderId: 'disp-001', senderName: 'Operations Desk', senderRole: 'dispatcher', body: 'Copy. We have IGN-2024-X1 in inventory at your location. Proceed with replacement.', read: false, createdAt: hoursAgo(0.6) },
  ],
  'job-008': [
    { id: 'msg-008', jobId: 'job-008', senderId: 'tech-001', senderName: 'Marcus Rivera', senderRole: 'technician', body: 'Installation complete. Unit is regenerating. Will wait for full cycle to verify.', read: true, createdAt: daysAgo(1) },
    { id: 'msg-009', jobId: 'job-008', senderId: 'disp-001', senderName: 'Operations Desk', senderRole: 'dispatcher', body: 'Great work! Please complete the job in the system when done.', read: true, createdAt: daysAgo(1) },
  ],
};

export const mockNotifications: NotificationDTO[] = [
  { id: 'notif-001', jobId: 'job-004', type: 'job_assigned', title: 'Emergency Job Assigned', message: 'Water heater emergency at Dan Wilson\'s residence. Priority dispatch.', read: false, createdAt: hoursAgo(1) },
  { id: 'notif-002', jobId: 'job-001', type: 'schedule_change', title: 'Schedule Updated', message: 'Job at Alice Johnson rescheduled to 8:00 AM.', read: true, createdAt: hoursAgo(4) },
  { id: 'notif-003', type: 'system', title: 'Weekly Summary', message: 'You completed 12 jobs this week with a 98% completion rate.', read: false, createdAt: hoursAgo(12) },
  { id: 'notif-004', jobId: 'job-007', type: 'message', title: 'New Message from Jenna', message: 'Jenna Walsh needs ignitor part confirmation.', read: false, createdAt: hoursAgo(0.7) },
  { id: 'notif-005', jobId: 'job-004', type: 'escalation', title: 'Job Escalated', message: 'Job job-004 has been escalated for emergency handling.', read: false, createdAt: hoursAgo(1) },
];

export const mockTimelines: Record<string, TimelineEventDTO[]> = {
  'job-001': [
    { id: 'tl-001', jobId: 'job-001', type: 'created', description: 'Job created from appointment', actorName: 'System', createdAt: daysAgo(1) },
    { id: 'tl-002', jobId: 'job-001', type: 'assigned', description: 'Assigned to Marcus Rivera', actorName: 'System', createdAt: daysAgo(1) },
  ],
  'job-007': [
    { id: 'tl-003', jobId: 'job-007', type: 'created', description: 'Job created from appointment', actorName: 'System', createdAt: daysAgo(1) },
    { id: 'tl-004', jobId: 'job-007', type: 'assigned', description: 'Assigned to Jenna Walsh', actorName: 'System', createdAt: daysAgo(1) },
    { id: 'tl-005', jobId: 'job-007', type: 'status_changed', description: 'Status changed to In Progress', actorName: 'Jenna Walsh', createdAt: hoursAgo(1) },
    { id: 'tl-006', jobId: 'job-007', type: 'checklist_completed', description: 'Checklist items 1-2 completed: Thermostat signal checked, Ignitor inspected', actorName: 'Jenna Walsh', createdAt: hoursAgo(0.8) },
    { id: 'tl-007', jobId: 'job-007', type: 'note_added', description: 'Diagnosis note added: Ignitor glows weak - needs replacement', actorName: 'Jenna Walsh', createdAt: hoursAgo(0.8) },
  ],
  'job-004': [
    { id: 'tl-008', jobId: 'job-004', type: 'created', description: 'Emergency job created', actorName: 'System', createdAt: hoursAgo(1.5) },
    { id: 'tl-009', jobId: 'job-004', type: 'assigned', description: 'Assigned to Marcus Rivera - Emergency Dispatch', actorName: 'System', createdAt: hoursAgo(1.5) },
    { id: 'tl-010', jobId: 'job-004', type: 'escalated', description: 'Escalated to Operations Manager - Emergency protocol', actorName: 'System', createdAt: hoursAgo(1) },
  ],
  'job-008': [
    { id: 'tl-011', jobId: 'job-008', type: 'created', description: 'Job created from appointment', actorName: 'System', createdAt: daysAgo(7) },
    { id: 'tl-012', jobId: 'job-008', type: 'assigned', description: 'Assigned to Marcus Rivera', actorName: 'System', createdAt: daysAgo(3) },
    { id: 'tl-013', jobId: 'job-008', type: 'status_changed', description: 'Status changed to In Progress', actorName: 'Marcus Rivera', createdAt: daysAgo(1) },
    { id: 'tl-014', jobId: 'job-008', type: 'parts_used', description: 'Parts used: Compression Fitting x2, Drain Hose Kit, Ball Valve, Teflon Tape', actorName: 'Marcus Rivera', createdAt: daysAgo(1) },
    { id: 'tl-015', jobId: 'job-008', type: 'signature_captured', description: 'Customer signature captured', actorName: 'Marcus Rivera', createdAt: daysAgo(1) },
    { id: 'tl-016', jobId: 'job-008', type: 'evidence_uploaded', description: 'Photos uploaded: Installation complete', actorName: 'Marcus Rivera', createdAt: daysAgo(1) },
    { id: 'tl-017', jobId: 'job-008', type: 'status_changed', description: 'Status changed to Completed', actorName: 'Marcus Rivera', createdAt: daysAgo(1) },
  ],
};

export const mockDashboard = {
  completionRate: 93.8,
  totalJobsToday: 6,
  completedJobsToday: 1,
  unreadMessages: 3,
  unreadNotifications: 4,
};

export const defaultTechnicianProfile = {
  id: 'tech-001',
  name: 'Marcus Rivera',
  email: 'marcus@resqai.com',
  phone: '+1-555-9001',
  role: 'senior_technician',
  isOnline: true,
  skills: ['HVAC', 'Electrical', 'Plumbing'],
  certifications: ['EPA 608', 'NATE'],
  todayCompleted: 1,
  todayTotal: 6,
  completionRate: 93.8,
};
