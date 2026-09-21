import { useState, useRef, useEffect, type FC } from 'react';
import { Card, Button, Skeleton, ErrorState } from '@resqai/foundation';
import { useJobDetail } from '../hooks/useJobDetail';
import { technicianService } from '../services/technician-service';
import { useAppContext } from '../state/AppContext';

interface SignatureCapturePageProps { jobId: string; }

export const SignatureCapturePage: FC<SignatureCapturePageProps> = ({ jobId }) => {
  const { detail, loading, error, refetch } = useJobDetail(jobId);
  const { addNotification } = useAppContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#e6ecf5';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    const data = canvas.toDataURL('image/png');
    try {
      await technicianService.completeJob(jobId, {
        completionNotes: 'Signature captured via portal.',
        signatureData: data,
        signatureCustomerName: customerName || 'Customer',
      });
      addNotification({ type: 'success', title: 'Signature captured', message: 'Customer signature saved.' });
      refetch();
    } catch {
      addNotification({ type: 'error', title: 'Failed to save', message: 'Could not save signature.' });
    }
  };

  if (loading) return <div style={{ padding: 24 }}><Skeleton variant="rectangular" height={300} /></div>;
  if (error) return <div style={{ padding: 24 }}><ErrorState title="Failed to load" message={error} onRetry={refetch} /></div>;

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <Button size="sm" variant="ghost" onClick={() => { window.location.hash = `#/jobs/${jobId}`; }} style={{ marginBottom: 12 }}>
        &larr; Back to Job
      </Button>
      <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Customer Signature</h1>

      <Card variant="bordered" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#8b9bb5', display: 'block', marginBottom: 4 }}>Customer Name</label>
          <input
            type="text"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="Enter customer name"
            style={{
              width: '100%', padding: '8px 12px', background: '#131c2f', color: '#e6ecf5',
              border: '1px solid #243049', borderRadius: 6, fontSize: 13,
              boxSizing: 'border-box', fontFamily: 'inherit',
            }}
            aria-label="Customer name for signature"
          />
        </div>

        <div style={{ border: '1px solid #243049', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
          <canvas
            ref={canvasRef}
            width={500}
            height={200}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ width: '100%', height: 200, background: '#0b1220', cursor: 'crosshair', touchAction: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={clearCanvas}>Clear</Button>
          <Button variant="primary" onClick={handleSave} disabled={!hasSignature}>Save Signature</Button>
        </div>
      </Card>

      {detail?.signature && (
        <Card variant="bordered">
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', margin: '0 0 8px' }}>Saved Signature</h3>
          <p style={{ fontSize: 12, color: '#8b9bb5', margin: '0 0 8px' }}>Signed by: {detail.signature.customerName}</p>
          <p style={{ fontSize: 12, color: '#5a6a85', margin: 0 }}>{new Date(detail.signature.signedAt).toLocaleString()}</p>
          <img src={detail.signature.data} alt="Customer signature" style={{ maxWidth: '100%', maxHeight: 100, marginTop: 8 }} />
        </Card>
      )}
    </div>
  );
};
