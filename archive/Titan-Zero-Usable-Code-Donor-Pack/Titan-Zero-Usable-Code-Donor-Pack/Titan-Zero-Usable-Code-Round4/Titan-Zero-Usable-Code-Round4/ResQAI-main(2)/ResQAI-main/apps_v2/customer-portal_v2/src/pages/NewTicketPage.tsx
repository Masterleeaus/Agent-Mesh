import { useNavigate } from '../routes/useNavigate';
import { QuickTicketForm } from '../components/QuickTicketForm';
import { Card } from '../../../shared/src/components';

export function NewTicketPage() {
  const navigate = useNavigate();

  const handleSuccess = (ticketId: string) => {
    navigate(`/tickets/${ticketId}`);
  };

  const handleCancel = () => {
    navigate('/tickets');
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: '0 0 16px' }}>Create a New Ticket</h1>
      <QuickTicketForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
