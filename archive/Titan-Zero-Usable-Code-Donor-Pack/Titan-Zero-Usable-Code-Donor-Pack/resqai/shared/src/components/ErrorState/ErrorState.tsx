import { useMemo, type FC } from 'react';
import type { ErrorStateProps } from './ErrorState.types';
import { radius, spacing, typography } from '../../design-system/tokens';

export const ErrorState: FC<ErrorStateProps> = ({
  title = 'Something went wrong', message, error, icon, action, onRetry,
  retryLabel = 'Try Again', fullPage = false, style, className,
}) => {
  const errorMessage = message || (error ? (typeof error === 'string' ? error : error.message) : 'An unexpected error occurred. Please try again.');

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: spacing[2], padding: spacing[10], textAlign: 'center', ...style }} className={className}>
      <div style={{ color: 'var(--error, #dc2626)', marginBottom: spacing[2] }}>
        {icon || <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
      </div>
      <h3 style={{ margin: 0, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: 'var(--text-primary, #0f172a)', fontFamily: typography.fontFamily.heading }}>{title}</h3>
      <p style={{ margin: 0, fontSize: typography.fontSize.sm, color: 'var(--text-secondary, #475569)', fontFamily: typography.fontFamily.body, maxWidth: 480 }}>{errorMessage}</p>
      <div style={{ display: 'flex', gap: spacing[2], marginTop: spacing[3] }}>
        {onRetry && <button type="button" onClick={onRetry} style={{ height: 36, padding: `0 ${spacing[4]}`, border: '1px solid var(--border, #e2e8f0)', borderRadius: radius.md, backgroundColor: 'var(--bg-card, #ffffff)', color: 'var(--text-primary, #0f172a)', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, cursor: 'pointer', fontFamily: typography.fontFamily.body }}>{retryLabel}</button>}
        {action}
      </div>
    </div>
  );

  if (fullPage) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: spacing[4] }}>{content}</div>;
  }
  return content;
};
