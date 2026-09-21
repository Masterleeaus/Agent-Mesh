import type { FC } from 'react';
import type { WizardLayoutProps } from './WizardLayout.types';
import { radius, spacing, typography } from '../../design-system/tokens';

export const WizardLayout: FC<WizardLayoutProps> = ({
  steps, currentStep, children, header, footer, onStepClick, orientation = 'horizontal', style, className, contentStyle,
}) => {
  const isHorizontal = orientation === 'horizontal';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', ...style }} className={className}>
      {header}
      <div style={{ flex: 1, display: 'flex', flexDirection: isHorizontal ? 'column' : 'row', overflow: 'hidden' }}>
        <div style={{
          display: 'flex', flexDirection: isHorizontal ? 'row' : 'column',
          padding: spacing[4], gap: 0, backgroundColor: 'var(--bg-card, #ffffff)',
          borderBottom: isHorizontal ? '1px solid var(--border, #e2e8f0)' : 'none',
          borderRight: !isHorizontal ? '1px solid var(--border, #e2e8f0)' : 'none',
          minWidth: !isHorizontal ? 240 : undefined, overflow: 'auto',
        }}>
          {steps.map((step, idx) => {
            const isActive = idx === currentStep;
            const isComplete = idx < currentStep;
            const isClickable = idx <= currentStep;
            return (
              <div
                key={step.id}
                onClick={() => isClickable && onStepClick?.(idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: spacing[2],
                  padding: `${spacing[2.5]} ${spacing[3]}`,
                  cursor: isClickable ? 'pointer' : 'default',
                  opacity: isClickable ? 1 : 0.5,
                  borderRadius: radius.md,
                  backgroundColor: isActive ? 'var(--accent-light, #dbeafe)' : 'transparent',
                  transition: 'background-color 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{
                  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold,
                  backgroundColor: isComplete ? 'var(--success, #16a34a)' : isActive ? 'var(--accent, #2563eb)' : 'var(--border, #e2e8f0)',
                  color: isComplete || isActive ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                }}>
                  {isComplete ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : idx + 1}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: typography.fontSize.sm, fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.medium, color: 'var(--text-primary, #0f172a)', fontFamily: typography.fontFamily.body }}>{step.label}</span>
                  {step.description && <span style={{ fontSize: typography.fontSize.xs, color: 'var(--text-muted, #94a3b8)', fontFamily: typography.fontFamily.body }}>{step.description}</span>}
                </div>
              </div>
            );
          })}
        </div>
        <main style={{ flex: 1, overflow: 'auto', padding: spacing[6], backgroundColor: 'var(--bg-page, #f8fafc)', ...contentStyle }}>
          {children}
        </main>
      </div>
      {footer}
    </div>
  );
};
