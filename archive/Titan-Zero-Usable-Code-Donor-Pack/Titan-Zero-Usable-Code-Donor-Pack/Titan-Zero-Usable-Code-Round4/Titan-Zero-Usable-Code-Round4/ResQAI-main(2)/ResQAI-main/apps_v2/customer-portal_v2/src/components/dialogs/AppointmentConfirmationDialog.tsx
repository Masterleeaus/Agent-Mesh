interface AppointmentConfirmationDialogProps {
  open: boolean;
  serviceType: string;
  date: string;
  time: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function AppointmentConfirmationDialog({ open, serviceType, date, time, onConfirm, onClose }: AppointmentConfirmationDialogProps) {
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
         onClick={onClose}>
      <div style={{ background: '#131c2f', borderRadius: 12, border: '1px solid #243049', padding: 24, maxWidth: 400, width: '90%' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
          <h3 style={{ color: '#e6ecf5', fontSize: 18, margin: 0 }}>Confirm Appointment</h3>
        </div>
        <div style={{ background: '#0b1220', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#8b9bb5', fontSize: 13 }}>Service</span>
            <span style={{ color: '#e6ecf5', fontSize: 13, fontWeight: 600 }}>{serviceType}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#8b9bb5', fontSize: 13 }}>Date</span>
            <span style={{ color: '#e6ecf5', fontSize: 13, fontWeight: 600 }}>{new Date(date).toLocaleDateString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#8b9bb5', fontSize: 13 }}>Time</span>
            <span style={{ color: '#e6ecf5', fontSize: 13, fontWeight: 600 }}>{time}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #243049', background: 'transparent', color: '#e6ecf5', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#41d1c4', color: '#0b1220', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Confirm Booking</button>
        </div>
      </div>
    </div>
  );
}