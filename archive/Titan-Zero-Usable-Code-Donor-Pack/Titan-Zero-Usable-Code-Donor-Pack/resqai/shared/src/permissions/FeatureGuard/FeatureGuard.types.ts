import type { CSSProperties, ReactNode } from 'react';

export interface FeatureGuardProps {
  feature: string;
  enabledFeatures: string[];
  fallback?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}
