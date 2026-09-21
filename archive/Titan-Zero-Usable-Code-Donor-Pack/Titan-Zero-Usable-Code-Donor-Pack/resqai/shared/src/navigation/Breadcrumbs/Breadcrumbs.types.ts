import type { CSSProperties, ReactNode } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: string | ReactNode;
  maxItems?: number;
  size?: 'sm' | 'md' | 'lg';
  style?: CSSProperties;
  className?: string;
}
