interface FeedbackConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
}

export function FeedbackConfirmationDialog({ open, onClose }: FeedbackConfirmationDialogProps) {
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
         onClick={onClose}>
      <div style={{ background: '#131c2f', borderRadius: 12, border: '1px solid #243049', padding: 24, maxWidth: 400, width: '90%', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
        <h3 style={{ color: '#e6ecf5', fontSize: 18, margin: '0 0 8px' }}>Thank You!</h3>
        <p style={{ color: '#8b9bb5', fontSize: 13, margin: '0 0 20px' }}>Your feedback has been submitted successfully. We value your input to help us improve our service.</p>
        <button onClick={onClose} style={{ padding: '10px 32px', borderRadius: 8, border: 'none', background: '#41d1c4', color: '#0b1220', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Done</button>
      </div>
    </div>
  );
}