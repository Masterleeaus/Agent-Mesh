export const TITAN_NATIVE_SURFACE_SERVICE_SCHEMA = 'titan.ui.native-service-binding.v1' as const;

export type TitanNativeSurfaceKey =
  | 'business'
  | 'workforce'
  | 'customers'
  | 'jobs'
  | 'quotes'
  | 'scheduling'
  | 'invoices'
  | 'marketplace'
  | 'settings';

export type TitanNativeSurfaceBinding = Readonly<{
  schema: typeof TITAN_NATIVE_SURFACE_SERVICE_SCHEMA;
  surface: TitanNativeSurfaceKey;
  page_route: string;
  read_authority: 'native_domain_service' | 'native_runtime_projection';
  command_authority: 'existing_api_route' | 'governed_workforce_gateway' | 'marketplace_owner';
  native_modules: readonly string[];
  api_routes: readonly string[];
  company_boundary: 'company_id';
  identity_grants_authority: false;
  binding_grants_authority: false;
  execution_permitted: false;
}>;

const binding = (
  surface: TitanNativeSurfaceKey,
  page_route: string,
  read_authority: TitanNativeSurfaceBinding['read_authority'],
  command_authority: TitanNativeSurfaceBinding['command_authority'],
  native_modules: readonly string[],
  api_routes: readonly string[],
): TitanNativeSurfaceBinding => Object.freeze({
  schema: TITAN_NATIVE_SURFACE_SERVICE_SCHEMA,
  surface,
  page_route,
  read_authority,
  command_authority,
  native_modules: Object.freeze([...native_modules]),
  api_routes: Object.freeze([...api_routes]),
  company_boundary: 'company_id',
  identity_grants_authority: false,
  binding_grants_authority: false,
  execution_permitted: false,
});

export const TITAN_NATIVE_SURFACE_BINDINGS: Readonly<Record<TitanNativeSurfaceKey, TitanNativeSurfaceBinding>> = Object.freeze({
  business: binding(
    'business', '/app', 'native_domain_service', 'existing_api_route',
    ['lib/operations/business-day.ts', 'lib/operations/state.ts'],
    ['/api/v1/business-day/transition'],
  ),
  workforce: binding(
    'workforce', '/app/settings', 'native_runtime_projection', 'governed_workforce_gateway',
    ['lib/titan/workforce-lifecycle/inspection.ts', 'lib/titan/workforce-command-gateway.ts'],
    ['/api/v1/titan/workforce/commands', '/api/v1/titan/workforce/agents/plan'],
  ),
  customers: binding(
    'customers', '/app/clients', 'native_domain_service', 'existing_api_route',
    ['lib/crm/normalization.ts'],
    ['/api/v1/clients', '/api/v1/clients/[id]'],
  ),
  jobs: binding(
    'jobs', '/app/jobs', 'native_domain_service', 'existing_api_route',
    ['lib/jobs/project-board.ts', 'lib/jobs/schedule-guard.ts'],
    ['/api/v1/jobs', '/api/v1/jobs/[id]', '/api/v1/jobs/[id]/transition'],
  ),
  quotes: binding(
    'quotes', '/app/estimates', 'native_domain_service', 'existing_api_route',
    ['lib/estimates/repository.ts', 'lib/estimates/transitions.ts'],
    ['/api/v1/estimates', '/api/v1/estimates/[id]', '/api/v1/estimates/[id]/transition'],
  ),
  scheduling: binding(
    'scheduling', '/app/schedule', 'native_domain_service', 'existing_api_route',
    ['lib/visits/queries.ts', 'lib/jobs/schedule-guard.ts'],
    ['/api/v1/visits/[id]', '/api/v1/visits/[id]/transition', '/api/v1/titan/workforce/native/scheduling'],
  ),
  invoices: binding(
    'invoices', '/app/invoices', 'native_domain_service', 'existing_api_route',
    ['lib/invoices/db.ts', 'lib/invoices/payments.ts'],
    ['/api/v1/invoices', '/api/v1/invoices/[id]', '/api/v1/invoices/[id]/transition'],
  ),
  marketplace: binding(
    'marketplace', '/app/settings', 'native_runtime_projection', 'marketplace_owner',
    ['packages/titan-platform/src/ported/cleaning-marketplace.ts', 'packages/titan-platform/src/ported/cleaning-workforce-marketplace.ts'],
    [],
  ),
  settings: binding(
    'settings', '/app/settings', 'native_domain_service', 'existing_api_route',
    ['lib/pricing/settings.ts', 'lib/travel/settings.ts', 'lib/integrations/square-payments.ts'],
    ['/api/v1/pricing/settings', '/api/v1/travel/settings', '/api/v1/users/[id]'],
  ),
});

function cleanCompanyId(companyId: string): string {
  const value = String(companyId ?? '').trim();
  if (!value) throw new Error('company_id-required');
  return value;
}

export function bindNativeSurface(surface: TitanNativeSurfaceKey, companyId: string): Readonly<{
  company_id: string;
  binding: TitanNativeSurfaceBinding;
  execution_permitted: false;
  grants_authority: false;
}> {
  const company_id = cleanCompanyId(companyId);
  const native = TITAN_NATIVE_SURFACE_BINDINGS[surface];
  if (!native) throw new Error(`native-surface-binding-not-found:${surface}`);
  return Object.freeze({
    company_id,
    binding: native,
    execution_permitted: false as const,
    grants_authority: false as const,
  });
}

export function listNativeSurfaceBindings(): readonly TitanNativeSurfaceBinding[] {
  return Object.freeze(Object.values(TITAN_NATIVE_SURFACE_BINDINGS));
}
