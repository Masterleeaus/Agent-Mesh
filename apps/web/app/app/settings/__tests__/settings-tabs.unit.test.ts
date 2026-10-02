import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsTabsClient } from '../SettingsTabsClient';
import { ToastProvider } from '@/components/ui/Toast';
import type { WorkforceHierarchyInspection } from '../workforce-hierarchy-data';

const state = vi.hoisted(() => ({ activeTab: 'workforce' }));
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, useState: (initial: unknown) => actual.useState(initial === 'profile' ? state.activeTab : initial) };
});
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }) }));
vi.stubGlobal('React', React);
afterEach(() => { state.activeTab = 'workforce'; });

const hierarchy: WorkforceHierarchyInspection = {
  schema: 'titan.workforce.hierarchy-ui-inspection.v1', companyId: 'company-1',
  rows: [{ tier: 'manager', id: 'manager-1', label: 'Operations manager', parentId: null, domain: 'operations', state: 'catalogue', executionAuthority: false }],
  counts: { managers: 1, supervisors: 0, agents: 0, workers: 0 }, readOnly: true, executionPermitted: false, grantsAuthority: false, source: 'workforce-organizational-graph',
};
const props: React.ComponentProps<typeof SettingsTabsClient> = {
  role: 'owner' as 'owner' | 'admin' | 'tech', userId: 'user-1', me: { id: 'user-1', full_name: 'Alex', email: 'alex@example.test', phone: null }, account: { id: 'company-1', name: 'Company', settings: {} }, users: [], square: null, workforceLifecycle: [{
    schema: 'titan.workforce.lifecycle-ui-inspection.v1', company_id: 'company-1', agent_key: 'customer-care', lifecycle_state: 'ENABLED', health_state: 'READY', active_work_count: 2, accepts_new_assignments: true, compatible: true, status_reasons: [], controls: [], migration_phase: null, replacement_phase: null, retirement_phase: null, read_only_projection: true, marketplace_owned: false, mutation_actions: [], execution_permitted: false, grants_authority: false,
  }], workforceHierarchy: hierarchy,
};
function render(role = props.role) {
  return renderToStaticMarkup(React.createElement(ToastProvider, null, React.createElement(SettingsTabsClient, { ...props, role })));
}

describe('settings workforce projections', () => {
  it.each(['owner', 'admin'] as const)('keeps lifecycle and hierarchy reachable for %s', (role) => {
    const html = render(role);
    expect(html).toContain('Workforce');
    expect(html).toContain('Lifecycle controls are request-only');
    expect(html).toContain('Operations manager');
    expect(html).toContain('customer-care');
    expect(html).toContain('2 active');
    expect(html).toContain('execution permitted: no');
  });
  it('does not expose workforce inspection to technicians even with a selected tab', () => {
    const html = render('tech');
    expect(html).not.toContain('Workforce');
    expect(html).not.toContain('Operations manager');
  });
});
