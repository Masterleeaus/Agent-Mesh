import type { CSSProperties, ReactNode } from 'react';

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  header: string;
  render?: (value: unknown, row: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  hidden?: boolean;
}

export interface TableRow {
  id: string | number;
  [key: string]: unknown;
}

export interface TableProps<T extends TableRow = TableRow> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  sortable?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onRowClick?: (row: T) => void;
  selectedRowId?: string | number;
  compact?: boolean;
  stickyHeader?: boolean;
  maxHeight?: string;
  style?: CSSProperties;
  className?: string;
}

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}
