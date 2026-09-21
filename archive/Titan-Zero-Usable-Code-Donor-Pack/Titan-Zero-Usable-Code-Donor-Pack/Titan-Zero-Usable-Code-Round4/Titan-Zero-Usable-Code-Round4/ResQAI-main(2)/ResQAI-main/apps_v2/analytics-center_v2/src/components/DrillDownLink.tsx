interface DrillDownLinkProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function DrillDownLink({ label, onClick, disabled }: DrillDownLinkProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        color: disabled ? '#4a5568' : '#41d1c4',
        fontSize: 12,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {label}
      <span style={{ fontSize: 14 }}>{'\u2192'}</span>
    </button>
  );
}
