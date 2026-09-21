import { describe, expect, it } from 'vitest';
import {
  TITAN_NATIVE_SURFACE_BINDINGS,
  bindNativeSurface,
  listNativeSurfaceBindings,
} from '../native-service-bindings';

const EXPECTED = [
  'business',
  'workforce',
  'customers',
  'jobs',
  'quotes',
  'scheduling',
  'invoices',
  'marketplace',
  'settings',
] as const;

describe('native service bindings', () => {
  it('covers every Pass 3 core standalone surface', () => {
    expect(listNativeSurfaceBindings().map((entry) => entry.surface)).toEqual(EXPECTED);
  });

  it('keeps company scope and authority fail-closed', () => {
    for (const surface of EXPECTED) {
      const resolved = bindNativeSurface(surface, 'company-1');
      expect(resolved.company_id).toBe('company-1');
      expect(resolved.execution_permitted).toBe(false);
      expect(resolved.grants_authority).toBe(false);
      expect(resolved.binding.company_boundary).toBe('company_id');
      expect(resolved.binding.identity_grants_authority).toBe(false);
    }
  });

  it('rejects missing company scope', () => {
    expect(() => bindNativeSurface('jobs', '   ')).toThrow('company_id-required');
  });

  it('keeps workforce and marketplace command ownership outside Settings', () => {
    expect(TITAN_NATIVE_SURFACE_BINDINGS.workforce.command_authority).toBe('governed_workforce_gateway');
    expect(TITAN_NATIVE_SURFACE_BINDINGS.marketplace.command_authority).toBe('marketplace_owner');
  });
});
