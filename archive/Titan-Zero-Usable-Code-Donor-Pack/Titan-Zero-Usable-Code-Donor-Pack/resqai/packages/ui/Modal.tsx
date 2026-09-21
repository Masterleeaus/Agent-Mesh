import type { FC, ReactNode, CSSProperties } from 'react';

interface ModalProps {
  children: ReactNode;
  open: boolean;
  onClose?: () => void;
  title?: string;
  style?: CSSProperties;
}

export const Modal: FC<ModalProps> = ({
  children,
  open,
  onClose,
  title,
  style,
}) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card, var(--card, #fffefa))',
          borderRadius: 'var(--radius, 8px)',
          border: '1px solid var(--border)',
          padding: 24,
          minWidth: 320,
          maxWidth: 560,
          maxHeight: '80vh',
          overflowY: 'auto',
          ...style,
        }}
      >
        {title && (
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              margin: '0 0 16px 0',
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
};
