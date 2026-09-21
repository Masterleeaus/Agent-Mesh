import { useState } from 'react';
import { useInvoiceDetail } from '../hooks/useInvoiceDetail';
import { Card, StatusBadge, Button, Skeleton, EmptyState, ErrorState } from '../../../shared/src/components';
import { PaymentStatus } from '../models/dto';
import { CustomerService } from '../services/customer-service';
import { PaymentConfirmationDialog } from '../components/dialogs/PaymentConfirmationDialog';
import { useNavigate } from '../routes/useNavigate';

interface InvoiceDetailPageProps {
  invoiceId: string;
}

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  [PaymentStatus.Paid]: 'success', [PaymentStatus.Pending]: 'warning', [PaymentStatus.Overdue]: 'error',
  [PaymentStatus.Cancelled]: 'neutral', [PaymentStatus.Refunded]: 'info',
};

export function InvoiceDetailPage({ invoiceId }: InvoiceDetailPageProps) {
  const { data, loading, error } = useInvoiceDetail(invoiceId);
  const [showPayment, setShowPayment] = useState(false);
  const [paying, setPaying] = useState(false);
  const navigate = useNavigate();

  const handlePay = async () => {
    setPaying(true);
    try {
      await CustomerService.makePayment({ invoiceId, amount: data?.amount ?? 0, method: 'credit_card' });
      setShowPayment(false);
      window.location.reload();
    } catch { } finally { setPaying(false); }
  };

  if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}><Skeleton variant="rectangular" height={40} width={200} /><Skeleton variant="card" /><Skeleton variant="card" /></div>;
  if (error) return <ErrorState title="Failed to load invoice" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  if (!data) return <EmptyState title="Invoice not found" description={`No invoice found with ID ${invoiceId}.`} action={<Button variant="primary" onClick={() => navigate('/invoices')}>Back to Invoices</Button>} />;

  const canPay = data.status === PaymentStatus.Pending || data.status === PaymentStatus.Overdue;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>&larr; Back</Button>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: '8px 0 0' }}>{data.invoiceNumber}</h1>
        </div>
        <StatusBadge variant={statusVariant[data.status]} size="md">{data.status.replace(/_/g, ' ')}</StatusBadge>
      </div>

      <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Invoice Summary</span>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><span style={{ color: '#6b7b95', fontSize: 12 }}>Amount Due</span><div style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5' }}>${data.amount.toFixed(2)}</div></div>
          <div><span style={{ color: '#6b7b95', fontSize: 12 }}>Paid</span><div style={{ fontSize: 24, fontWeight: 700, color: '#41d1c4' }}>${data.paidAmount.toFixed(2)}</div></div>
          <div><span style={{ color: '#6b7b95', fontSize: 12 }}>Issued</span><div style={{ color: '#e6ecf5', fontSize: 14 }}>{new Date(data.issuedDate).toLocaleDateString()}</div></div>
          <div><span style={{ color: '#6b7b95', fontSize: 12 }}>Due Date</span><div style={{ color: '#e6ecf5', fontSize: 14 }}>{new Date(data.dueDate).toLocaleDateString()}</div></div>
        </div>
      </Card>

      <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Line Items</span>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.lineItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1a2744' }}>
              <div>
                <div style={{ fontSize: 13, color: '#e6ecf5' }}>{item.description}</div>
                <div style={{ fontSize: 11, color: '#6b7b95' }}>Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>${item.total.toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid #243049', marginTop: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#e6ecf5' }}>Total</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#e6ecf5' }}>${data.amount.toFixed(2)}</span>
        </div>
      </Card>

      {canPay && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="primary" onClick={() => setShowPayment(true)}>Pay Now</Button>
        </div>
      )}

      <PaymentConfirmationDialog
        open={showPayment}
        invoiceNumber={data.invoiceNumber}
        amount={data.amount}
        method="credit_card"
        onConfirm={handlePay}
        onClose={() => setShowPayment(false)}
        loading={paying}
      />
    </div>
  );
}