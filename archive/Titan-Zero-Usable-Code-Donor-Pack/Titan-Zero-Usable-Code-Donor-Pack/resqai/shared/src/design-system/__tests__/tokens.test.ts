import { describe, it, expect } from 'vitest';
import { lightColors, darkColors, typography, spacing, borders, radius, breakpoints, up, down } from '../tokens';

describe('Color tokens', () => {
  it('light colors have all required keys', () => {
    expect(lightColors.primary).toBeDefined();
    expect(lightColors.background.page).toBeDefined();
    expect(lightColors.text.primary).toBeDefined();
    expect(lightColors.border.default).toBeDefined();
    expect(lightColors.status.success).toBeDefined();
  });

  it('dark colors differ from light', () => {
    expect(darkColors.background.page).not.toBe(lightColors.background.page);
    expect(darkColors.text.primary).not.toBe(lightColors.text.primary);
  });

  it('all status colors are defined in both themes', () => {
    const statusKeys = ['success', 'warning', 'error', 'info'] as const;
    for (const key of statusKeys) {
      expect(lightColors.status[key]).toBeDefined();
      expect(darkColors.status[key]).toBeDefined();
    }
  });
});

describe('Typography tokens', () => {
  it('has all required properties', () => {
    expect(typography.fontFamily.body).toBeDefined();
    expect(typography.fontSize.base).toBe('1rem');
    expect(typography.fontWeight.semibold).toBe(600);
  });
});

describe('Spacing tokens', () => {
  it('has common spacing values', () => {
    expect(spacing[0]).toBe('0px');
    expect(spacing[4]).toBe('1rem');
  });
});

describe('Border tokens', () => {
  it('has width and style', () => {
    expect(borders.width.thin).toBe('1px');
    expect(borders.style.solid).toBe('solid');
  });
});

describe('Radius tokens', () => {
  it('has standard radii', () => {
    expect(radius.md).toBe('0.375rem');
    expect(radius.full).toBe('9999px');
  });
});

describe('Breakpoint helpers', () => {
  it('up generates correct media query', () => {
    expect(up('md')).toContain('min-width: 768px');
  });

  it('down generates correct media query', () => {
    expect(down('md')).toContain('max-width: 767.98px');
  });
});
