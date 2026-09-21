import { useMemo, type FC } from 'react';
import type { TableProps, TableColumn } from './Table.types';
import { radius, spacing, typography, animation } from '../../design-system/tokens';

export function Table<T extends { id: string | number }>({
  columns, data, loading = false, emptyMessage = 'No data',
  sortable = false, onSort, sortKey, sortDirection = 'asc',
  onRowClick, selectedRowId, compact = false, stickyHeader = false,
  maxHeight, style, className,
}: TableProps<T>) {
  const visibleColumns = useMemo(() => columns.filter(c => !c.hidden), [columns]);

  const headerStyle: React.CSSProperties = {
    display: 'flex', borderBottom: '2px solid var(--border, #e2e8f0)',
    backgroundColor: 'var(--bg-page, #f8fafc)', borderRadius: `${radius.lg} ${radius.lg} 0 0`,
    position: stickyHeader ? 'sticky' : undefined, top: stickyHeader ? 0 : undefined, zIndex: stickyHeader ? 1 : undefined,
  };

  const cellStyle = (col: TableColumn<T>): React.CSSProperties => ({
    flex: col.width ? `0 0 ${col.width}` : 1, minWidth: col.width || 0,
    padding: compact ? `${spacing[2]} ${spacing[3]}` : `${spacing[3]} ${spacing[4]}`,
    fontSize: compact ? typography.fontSize.sm : typography.fontSize.sm,
    fontFamily: typography.fontFamily.body, fontWeight: typography.fontWeight.semibold,
    color: 'var(--text-secondary, #475569)', textAlign: col.align || 'left',
    cursor: col.sortable ? 'pointer' : undefined, userSelect: 'none',
    display: 'flex', alignItems: 'center', gap: spacing[1],
  });

  const rowStyle = (row: T): React.CSSProperties => ({
    display: 'flex', borderBottom: '1px solid var(--border, #e2e8f0)',
    backgroundColor: selectedRowId === row.id ? 'var(--accent-light, #dbeafe)' : 'transparent',
    cursor: onRowClick ? 'pointer' : undefined,
    transition: `background-color ${animation.duration.fast} ${animation.easing.ease}`,
  });

  const dataCellStyle = (col: TableColumn<T>): React.CSSProperties => ({
    flex: col.width ? `0 0 ${col.width}` : 1, minWidth: col.width || 0,
    padding: compact ? `${spacing[2]} ${spacing[3]}` : `${spacing[3]} ${spacing[4]}`,
    fontSize: compact ? typography.fontSize.xs : typography.fontSize.sm,
    fontFamily: typography.fontFamily.body, color: 'var(--text-primary, #0f172a)',
    textAlign: col.align || 'left', display: 'flex', alignItems: 'center',
  });

  return (
    <div style={{ border: '1px solid var(--border, #e2e8f0)', borderRadius: radius.lg, overflow: 'hidden', maxHeight, overflowY: maxHeight ? 'auto' : undefined, ...style }} className={className}>
      {stickyHeader && <div style={headerStyle}>
        {visibleColumns.map(col => (
          <div key={col.key} style={cellStyle(col)} onClick={() => { if (col.sortable && onSort) { const dir = sortKey === col.key && sortDirection === 'asc' ? 'desc' : 'asc'; onSort(col.key, dir); } }}>
            {col.header}
            {col.sortable && sortKey === col.key && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: sortDirection === 'desc' ? 'rotate(180deg)' : undefined }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
          </div>
        ))}
      </div>}
      {loading ? (
        <TableSkeleton rows={5} columns={visibleColumns.length} />
      ) : data.length === 0 ? (
        <div style={{ padding: spacing[8], textAlign: 'center', color: 'var(--text-muted, #94a3b8)', fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.body }}>{emptyMessage}</div>
      ) : (
        <div>
          {!stickyHeader && <div style={headerStyle}>
            {visibleColumns.map(col => (
              <div key={col.key} style={cellStyle(col)} onClick={() => { if (col.sortable && onSort) { const dir = sortKey === col.key && sortDirection === 'asc' ? 'desc' : 'asc'; onSort(col.key, dir); } }}>
                {col.header}
                {col.sortable && sortKey === col.key && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: sortDirection === 'desc' ? 'rotate(180deg)' : undefined }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </div>
            ))}
          </div>}
          {data.map((row) => (
            <div key={row.id} style={rowStyle(row)} onClick={() => onRowClick?.(row)} onMouseEnter={e => { if (onRowClick) e.currentTarget.style.backgroundColor = 'var(--bg-page, #f8fafc)'; }} onMouseLeave={e => { if (onRowClick) e.currentTarget.style.backgroundColor = selectedRowId === row.id ? 'var(--accent-light, #dbeafe)' : 'transparent'; }}>
              {visibleColumns.map(col => (
                <div key={col.key} style={dataCellStyle(col)}>
                  {col.render ? col.render(row[col.key], row, data.indexOf(row)) : String(row[col.key] ?? '')}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const TableSkeleton: FC<{ rows?: number; columns?: number }> = ({ rows = 3, columns = 4 }) => (
  <div>
    {Array.from({ length: rows }).map((_, ri) => (
      <div key={ri} style={{ display: 'flex', borderBottom: '1px solid var(--border, #e2e8f0)', padding: spacing[3] }}>
        {Array.from({ length: columns }).map((_, ci) => (
          <div key={ci} style={{ flex: 1, padding: spacing[1] }}>
            <div style={{ height: 14, backgroundColor: 'var(--border, #e2e8f0)', borderRadius: radius.sm, animation: 'pulse 2s infinite', width: `${60 + Math.random() * 40}%` }} />
          </div>
        ))}
      </div>
    ))}
  </div>
);
