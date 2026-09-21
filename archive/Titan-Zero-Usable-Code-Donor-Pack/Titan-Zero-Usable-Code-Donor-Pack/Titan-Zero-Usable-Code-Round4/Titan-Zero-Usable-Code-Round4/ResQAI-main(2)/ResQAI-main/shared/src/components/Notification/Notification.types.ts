import type { CSSProperties, ReactNode } from 'react';

export type NotificationVariant = 'success' | 'warning' | 'error' | 'info';

export interface NotificationProps {
  children: ReactNode;
  variant?: NotificationVariant;
  title?: string;
  onClose?: () => void;
  action?: ReactNode;
  dismissible?: boolean;
  autoClose?: number;
  icon?: ReactNode;
  compact?: boolean;
  style?: CSSProperties;
  className?: string;
}

export interface NotificationToast extends Omit<NotificationProps, 'children' | 'autoClose' | 'onClose'> {
  id: string;
  message: string;
  duration?: number;
}

export interface NotificationCenterProps {
  notifications: NotificationToast[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;
  style?: CSSProperties;
  className?: string;
}
