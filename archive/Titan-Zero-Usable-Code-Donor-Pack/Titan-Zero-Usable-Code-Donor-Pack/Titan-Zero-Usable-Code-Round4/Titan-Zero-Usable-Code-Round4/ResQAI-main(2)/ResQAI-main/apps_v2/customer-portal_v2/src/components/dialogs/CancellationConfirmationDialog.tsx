interface CancellationConfirmationDialogProps {
  open: boolean;
  serviceType: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function CancellationConfirmationDialog({ open, serviceType, onConfirm, onClose }: CancellationConfirmationDialogProps) {
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
         onClick={onClose}>
      <div style={{ background: '#131c2f', borderRadius: 12, border: '1px solid #e74c3c', padding: 24, maxWidth: 400, width: '90%' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⚠️</div>
          <h3 style={{ color: '#e74c3c', fontSize: 18, margin: 0 }}>Cancel {serviceType}?</h3>
          <p style={{ color: '#8b9bb5', fontSize: 13, marginTop: 8 }}>This action cannot be undone. Are you sure you want to cancel this appointment?</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #243049', background: 'transparent', color: '#e6ecf5', cursor: 'pointer', fontSize: 14 }}>Keep Appointment</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#e74c3c', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Yes, Cancel</button>
        </div>
      </div>
    </div>
  );
}