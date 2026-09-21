import type { CSSProperties, ReactNode, MouseEvent } from 'react';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: DialogSize;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showClose?: boolean;
  preventScroll?: boolean;
  style?: CSSProperties;
  className?: string;
  contentStyle?: CSSProperties;
}
