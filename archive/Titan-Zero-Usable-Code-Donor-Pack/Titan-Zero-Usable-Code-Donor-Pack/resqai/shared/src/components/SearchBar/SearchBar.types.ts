import type { CSSProperties, ChangeEvent, KeyboardEvent } from 'react';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: (value: string) => void;
  debounceMs?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'minimal';
  autoFocus?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
  className?: string;
}
