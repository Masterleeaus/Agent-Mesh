import type { CSSProperties, ChangeEvent, FocusEvent, KeyboardEvent, ReactNode } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date';
  size?: InputSize;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  clearable?: boolean;
  maxLength?: number;
  name?: string;
  id?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  style?: CSSProperties;
  className?: string;
  inputStyle?: CSSProperties;
  inputClassName?: string;
}
