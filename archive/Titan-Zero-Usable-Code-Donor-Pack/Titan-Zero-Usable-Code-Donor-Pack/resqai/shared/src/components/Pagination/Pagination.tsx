import { useMemo, type FC } from 'react';
import type { PaginationProps } from './Pagination.types';
import { radius, spacing, typography } from '../../design-system/tokens';

function getPageRange(current: number, total: number, siblings: number): (number | 'ellipsis')[] {
  const totalPageNumbers = siblings * 2 + 5;
  if (totalPageNumbers >= total) return Array.from({ length: total }, (_, i) => i + 1);
  const leftSibling = Math.max(current - siblings, 1);
  const rightSibling = Math.min(current + siblings, total);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;
  if (!showLeftEllipsis && showRightEllipsis) {
    const leftCount = 3 + 2 * siblings;
    return [...Array.from({ length: leftCount }, (_, i) => i + 1), 'ellipsis', total];
  }
  if (showLeftEllipsis && !showRightEllipsis) {
    const rightCount = 3 + 2 * siblings;
    return [1, 'ellipsis', ...Array.from({ length: rightCount }, (_, i) => total - rightCount + i + 1)];
  }
  return [1, 'ellipsis', ...Array.from({ length: rightSibling - leftSibling + 1 }, (_, i) => leftSibling + i), 'ellipsis', total];
}

export const Pagination: FC<PaginationProps> = ({
  currentPage, totalPages, onPageChange, siblingCount = 1,
  showFirstLast = true, showPrevNext = true, size = 'md', variant = 'numbers', style, className,
}) => {
  const sizeConfig = { sm: { size: 28, fontSize: typography.fontSize.xs }, md: { size: 36, fontSize: typography.fontSize.sm }, lg: { size: 44, fontSize: typography.fontSize.base } };
  const sc = sizeConfig[size];

  const pages = useMemo(() => getPageRange(currentPage, totalPages, siblingCount), [currentPage, totalPages, siblingCount]);

  if (totalPages <= 1 && variant === 'numbers') return null;

  const buttonBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: sc.size, height: sc.size, borderRadius: radius.md,
    border: 'none', backgroundColor: 'transparent',
    color: 'var(--text-secondary, #475569)',
    fontSize: sc.fontSize, fontFamily: typography.fontFamily.body,
    cursor: 'pointer', transition: 'background-color 0.15s ease',
    userSelect: 'none',
  };

  const navStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: spacing[1], ...style,
  };

  if (variant === 'simple') {
    return (
      <div style={navStyle} className={className}>
        <button style={buttonBase} disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} aria-label="Previous page">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span style={{ fontSize: sc.fontSize, fontFamily: typography.fontFamily.body, color: 'var(--text-primary, #0f172a)', padding: `0 ${spacing[2]}` }}>
          Page {currentPage} of {totalPages}
        </span>
        <button style={buttonBase} disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} aria-label="Next page">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
    );
  }

  return (
    <div style={navStyle} className={className}>
      {showFirstLast && (
        <button style={buttonBase} disabled={currentPage <= 1} onClick={() => onPageChange(1)} aria-label="First page">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" /></svg>
        </button>
      )}
      {showPrevNext && (
        <button style={buttonBase} disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} aria-label="Previous page">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
      )}
      {pages.map((page, idx) => {
        if (page === 'ellipsis') {
          return <span key={`ellipsis-${idx}`} style={{ ...buttonBase, cursor: 'default', color: 'var(--text-muted, #94a3b8)' }}>...</span>;
        }
        const isCurrent = page === currentPage;
        return (
          <button
            key={page}
            style={{
              ...buttonBase,
              backgroundColor: isCurrent ? 'var(--accent, #2563eb)' : undefined,
              color: isCurrent ? '#ffffff' : undefined,
              fontWeight: isCurrent ? 600 : 400,
            }}
            onClick={() => onPageChange(page)}
            aria-label={`Page ${page}`}
            aria-current={isCurrent ? 'page' : undefined}
          >
            {page}
          </button>
        );
      })}
      {showPrevNext && (
        <button style={buttonBase} disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} aria-label="Next page">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      )}
      {showFirstLast && (
        <button style={buttonBase} disabled={currentPage >= totalPages} onClick={() => onPageChange(totalPages)} aria-label="Last page">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></svg>
        </button>
      )}
    </div>
  );
};
