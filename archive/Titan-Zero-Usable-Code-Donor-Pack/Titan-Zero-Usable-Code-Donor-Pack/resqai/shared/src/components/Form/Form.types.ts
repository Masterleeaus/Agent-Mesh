import type { CSSProperties, ReactNode, FormEvent } from 'react';

export interface FormProps {
  children: ReactNode;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  spacing?: 'compact' | 'normal' | 'relaxed';
  layout?: 'vertical' | 'horizontal' | 'inline';
  noValidate?: boolean;
  style?: CSSProperties;
  className?: string;
}

export interface FormFieldProps {
  children: ReactNode;
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  layout?: 'vertical' | 'horizontal';
  style?: CSSProperties;
  className?: string;
}

export interface FormSectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
  style?: CSSProperties;
  className?: string;
}
