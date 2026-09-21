import { useState, type FC } from 'react';
import { Card, Button } from '@resqai/foundation';
import { EscalationListTable, EscalateOperationForm, EscalationConfirmationDialog, PermissionGuard } from '../components';
import { useEscalations } from '../hooks/useEscalations';
import { useOperations } from '../hooks/useOperations';
import { OPERATIONS_CENTER_PERMISSIONS } from '../contracts/permissions';
import { useAppContext } from '../state/AppContext';
import { operationsService } from '../services/operations-service';

export const EscalationQueuePage: FC = () => {
  const { escalations, total, openCount, loading, error, refetch } = useEscalations();
  const { operations } = useOperations({ pageSize: 50 });
  const { addNotification } = useAppContext();
  const [showEscalateForm, setShowEscalateForm] = useState(false);
  const [escalateOpId, setEscalateOpId] = useState<string | null>(null);
  const [escalateReason, setEscalateReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [escalating, setEscalating] = useState(false);

  const handleEscalate = (opId: string, reason: string, escalateTo?: string) => {
    setEscalateOpId(opId);
    setEscalateReason(reason);
    setShowConfirm(true);
  };

  const confirmEscalation = async () => {
    if (!escalateOpId) return;
    setEscalating(true);
    try {
      await operationsService.escalate({ operationId: escalateOpId, reason: escalateReason });
      addNotification({ type: 'warning', title: 'Escalated', message: 'Operation has been escalated' });
      setShowConfirm(false);
      setShowEscalateForm(false);
      refetch();
    } catch {
      addNotification({ type: 'error', title: 'Escalation Failed', message: 'Failed to escalate operation' });
    } finally {
      setEscalating(false);
    }
  };

  const selectedOp = operations.find(o => o.id === escalateOpId);

  return (
    <PermissionGuard permission={OPERATIONS_CENTER_PERMISSIONS.VIEW_ESCALATIONS} fallback={
      <div style={{ padding: 24, textAlign: 'center', color: '#f87171' }}>
        <h2>Permission Denied</h2>
        <p>You do not have permission to view the Escalation Queue.</p>
      </div>
    }>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Escalation Queue</h1>
          <PermissionGuard permission={OPERATIONS_CENTER_PERMISSIONS.ESCALATE_OPERATION}>
            <Button onClick={() => setShowEscalateForm(!showEscalateForm)} aria-label="Escalate operation">
              {showEscalateForm ? 'Cancel' : '+ Escalate Operation'}
            </Button>
          </PermissionGuard>
        </div>

        {openCount > 0 && (
          <Card variant="bordered" style={{ padding: 12, marginBottom: 16, background: 'rgba(248, 113, 113, 0.05)', borderColor: '#f87171' }} role="alert">
            <span style={{ color: '#f87171', fontSize: 13 }}>{'\u26A0'} {openCount} open escalation{openCount !== 1 ? 's' : ''} requiring attention</span>
          </Card>
        )}

        {showEscalateForm && (
          <Card variant="bordered" style={{ padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#e6ecf5' }}>Escalate Operation</h3>
            <EscalateOperationForm
              operation={undefined}
              onSubmit={(opId, reason, escalateTo) => handleEscalate(opId, reason, escalateTo)}
              onCancel={() => setShowEscalateForm(false)}
            />
          </Card>
        )}

        <Card variant="bordered" style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div><span style={{ color: '#8b9bb5', fontSize: 13 }}>Total: </span><span style={{ color: '#e6ecf5', fontWeight: 600 }}>{total}</span></div>
            <div><span style={{ color: '#8b9bb5', fontSize: 13 }}>Open: </span><span style={{ color: '#f87171', fontWeight: 600 }}>{openCount}</span></div>
          </div>
          <EscalationListTable
            escalations={escalations}
            loading={loading}
            error={error}
            onRetry={refetch}
          />
        </Card>
      </div>

      <EscalationConfirmationDialog
        open={showConfirm}
        operation={selectedOp}
        reason={escalateReason}
        onConfirm={confirmEscalation}
        onCancel={() => setShowConfirm(false)}
        loading={escalating}
      />
    </PermissionGuard>
  );
};
