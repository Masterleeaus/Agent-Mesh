export const COMMON_TOOLSETS = ['POD'] as const;

export const COMMON_VISIBILITY = 'POD' as const;

export const COMMON_ALLOWED_ACTIONS = [
  'agent.read',
  'agent.execute',
  'agent.update',
  'agent.delete',
] as const;

export const TABLE_GRANTS = {
  read: (table: string) => ({
    resource_name: table,
    resource_type: 'datastore_table' as const,
    permission_ids: ['datastore.record.read', 'datastore.table.read'],
  }),
  write: (table: string) => ({
    resource_name: table,
    resource_type: 'datastore_table' as const,
    permission_ids: ['datastore.record.write', 'datastore.table.read'],
  }),
  readwrite: (table: string) => ({
    resource_name: table,
    resource_type: 'datastore_table' as const,
    permission_ids: ['datastore.record.read', 'datastore.record.write', 'datastore.table.read'],
  }),
} as const;

export const FUNCTION_GRANTS = {
  execute: (fnName: string) => ({
    resource_name: fnName,
    resource_type: 'function' as const,
    permission_ids: ['function.execute', 'function.read'],
  }),
};

export const COMMON_TABLES = {
  customers: 'customers',
  operationsLog: 'operations_log',
  tasks: 'tasks',
  accounts: 'accounts',
  followups: 'followups',
  appointments: 'appointments',
  disputes: 'disputes',
  tickets: 'tickets',
  technicians: 'technicians',
} as const;
