import type { CSSProperties, ReactNode } from 'react';

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  type?: 'checkbox' | 'radio' | 'switch';
}

export interface FilterProps {
  groups: FilterGroup[];
  values: Record<string, string[]>;
  onChange: (groupId: string, value: string, checked: boolean) => void;
  onClear?: () => void;
  onApply?: () => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  style?: CSSProperties;
  className?: string;
}

export interface ActiveFilter {
  groupId: string;
  groupLabel: string;
  value: string;
  label: string;
}
