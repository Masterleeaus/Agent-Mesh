import type { FC, ReactNode, CSSProperties } from 'react';

interface TableContainerProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export const TableContainer: FC<TableContainerProps> = ({
  children,
  style,
  className,
}) => (
  <div
    className={className}
    style={{
      overflowX: 'auto',
      borderRadius: 'var(--radius, 8px)',
      border: '1px solid var(--border, var(--line, #e7e0cf))',
      ...style,
    }}
  >
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 13,
      }}
    >
      {children}
    </table>
  </div>
);
