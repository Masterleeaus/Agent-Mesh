import type { CSSProperties, ReactNode } from 'react';

export interface DropdownOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
  description?: string;
}

export interface DropdownProps<T = string> {
  options: DropdownOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  clearable?: boolean;
  searchable?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  noOptionsMessage?: string;
  style?: CSSProperties;
  className?: string;
  menuStyle?: CSSProperties;
}
