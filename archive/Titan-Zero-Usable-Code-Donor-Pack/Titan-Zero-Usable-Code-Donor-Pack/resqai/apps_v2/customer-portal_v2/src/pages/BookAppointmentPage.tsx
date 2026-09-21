import { SelfServiceBooking } from '../components/SelfServiceBooking';
import { useNavigate } from '../routes/useNavigate';

export function BookAppointmentPage() {
  const navigate = useNavigate();

  const handleComplete = (_appointmentId: string) => {
    navigate('/appointments');
  };

  const handleCancel = () => {
    navigate('/appointments');
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: '0 0 16px' }}>Book an Appointment</h1>
      <SelfServiceBooking onComplete={handleComplete} onCancel={handleCancel} />
    </div>
  );
}
