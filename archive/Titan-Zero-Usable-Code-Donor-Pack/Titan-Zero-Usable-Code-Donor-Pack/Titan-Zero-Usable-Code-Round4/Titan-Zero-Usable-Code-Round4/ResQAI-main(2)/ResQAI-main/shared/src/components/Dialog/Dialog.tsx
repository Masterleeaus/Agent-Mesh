import { useEffect, useMemo, useCallback, type FC } from 'react';
import type { DialogProps, DialogSize } from './Dialog.types';
import { radius, spacing, typography, animation } from '../../design-system/tokens';

const sizeMap: Record<DialogSize, string> = {
  sm: '400px', md: '544px', lg: '720px', xl: '960px', fullscreen: '100%',
};

export const Dialog: FC<DialogProps> = ({
  open, onClose, title, children, footer, size = 'md',
  closeOnOverlay = true, closeOnEscape = true, showClose = true,
  preventScroll = true, style, className, contentStyle,
}) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (closeOnEscape && e.key === 'Escape') onClose();
  }, [closeOnEscape, onClose]);

  useEffect(() => {
    if (open && closeOnEscape) {
      document.addEventListener('keydown', handleKeyDown);
      if (preventScroll) document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (preventScroll) document.body.style.overflow = '';
    };
  }, [open, closeOnEscape, handleKeyDown, preventScroll]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)', animation: `fadeIn ${animation.duration.normal} ${animation.easing.ease}`,
        padding: spacing[4],
      }}
      onClick={(e) => { if (closeOnOverlay && e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%', maxWidth: sizeMap[size], maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          backgroundColor: 'var(--bg-elevated, #ffffff)',
          borderRadius: radius.xl, boxShadow: '0px 16px 24px rgba(0,0,0,0.1)',
          animation: `scaleIn ${animation.duration.normal} ${animation.easing.ease}`,
          overflow: 'hidden', ...style,
        }}
        className={className}
        role="dialog" aria-modal="true" aria-label={title}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: `${spacing[4]} ${spacing[5]}`, borderBottom: '1px solid var(--border, #e2e8f0)',
          }}>
            <h2 style={{ margin: 0, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: 'var(--text-primary, #0f172a)', fontFamily: typography.fontFamily.heading }}>{title}</h2>
            {showClose && (
              <button type="button" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, border: 'none', background: 'transparent', borderRadius: radius.md, cursor: 'pointer', color: 'var(--text-muted, #94a3b8)' }} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            )}
          </div>
        )}
        <div style={{ flex: 1, overflow: 'auto', padding: spacing[5], ...contentStyle }}>
          {children}
        </div>
        {footer && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: spacing[2],
            padding: `${spacing[3]} ${spacing[5]}`, borderTop: '1px solid var(--border, #e2e8f0)',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
