import type { CSSProperties, ReactNode } from 'react';

export interface ApplicationGuardProps {
  application: string;
  allowedApplications: string[];
  fallback?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}
