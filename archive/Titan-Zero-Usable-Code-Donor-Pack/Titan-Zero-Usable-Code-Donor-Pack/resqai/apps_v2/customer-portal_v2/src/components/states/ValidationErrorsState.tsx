interface ValidationErrorsStateProps {
  errors: string[];
  onDismiss?: () => void;
}

export function ValidationErrorsState({ errors, onDismiss }: ValidationErrorsStateProps) {
  if (errors.length === 0) return null;

  return (
    <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid #e74c3c', borderRadius: 8, padding: 12, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e74c3c', marginBottom: 4 }}>Please fix the following errors:</div>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {errors.map((err, i) => <li key={i} style={{ color: '#e74c3c', fontSize: 12, marginBottom: 2 }}>{err}</li>)}
          </ul>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: '#8b9bb5', cursor: 'pointer', fontSize: 16 }}>×</button>
        )}
      </div>
    </div>
  );
}