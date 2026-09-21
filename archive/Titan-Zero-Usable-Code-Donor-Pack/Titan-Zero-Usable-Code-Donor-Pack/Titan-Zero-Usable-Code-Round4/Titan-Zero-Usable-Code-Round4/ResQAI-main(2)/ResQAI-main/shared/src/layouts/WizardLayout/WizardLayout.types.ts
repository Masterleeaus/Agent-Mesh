import type { CSSProperties, ReactNode } from 'react';

export interface WizardStep {
  id: string;
  label: string;
  description?: string;
}

export interface WizardLayoutProps {
  steps: WizardStep[];
  currentStep: number;
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  onStepClick?: (index: number) => void;
  orientation?: 'horizontal' | 'vertical';
  style?: CSSProperties;
  className?: string;
  contentStyle?: CSSProperties;
}
