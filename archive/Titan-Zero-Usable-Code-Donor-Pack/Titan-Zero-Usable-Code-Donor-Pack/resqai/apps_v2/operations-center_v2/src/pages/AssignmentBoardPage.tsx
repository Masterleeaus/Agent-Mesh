import { useState, type FC } from 'react';
import { Card, Button, SearchBar, Pagination } from '@resqai/foundation';
import { AssignmentQueueTable, ReassignTechnicianForm, ReassignmentConfirmationDialog, PermissionGuard } from '../components';
import { useOperations } from '../hooks/useOperations';
import { useTechnicians } from '../hooks/useTechnicians';
import { useAppContext } from '../state/AppContext';
import { OPERATIONS_CENTER_PERMISSIONS } from '../contracts/permissions';
import { operationsService } from '../services/operations-service';

export const AssignmentBoardPage: FC = () => {
  const { selectedOperationIds, toggleOperationSelection, clearSelection, addNotification } = useAppContext();
  const { operations, loading, error, refetch } = useOperations({ pageSize: 50 });
  const { technicians } = useTechnicians();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [reassignOpId, setReassignOpId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmData, setConfirmData] = useState<{ newTechId: string; reason: string }>({ newTechId: '', reason: '' });
  const [reassigning, setReassigning] = useState(false);

  const assignableOps = operations.filter(op => op.status !== 'completed' && op.status !== 'cancelled');
  const filtered = assignableOps.filter(op => {
    if (!search) return true;
    const q = search.toLowerCase();
    return op.title.toLowerCase().includes(q) || op.customerName.toLowerCase().includes(q) || op.technicianName?.toLowerCase().includes(q) || false;
  });
  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleReassign = (opId: string) => {
    setReassignOpId(opId);
  };

  const submitReassign = (operationId: string, currentTechId: string, newTechnicianId: string, reason: string) => {
    setConfirmData({ newTechId: newTechnicianId, reason });
    setShowConfirm(true);
  };

  const confirmReassign = async () => {
    if (!reassignOpId) return;
    setReassigning(true);
    try {
      const op = operations.find(o => o.id === reassignOpId);
      await operationsService.reassign({
        operationId: reassignOpId,
        currentTechnicianId: op?.technicianId || '',
        newTechnicianId: confirmData.newTechId,
        reason: confirmData.reason,
      });
      addNotification({ type: 'success', title: 'Reassigned', message: 'Technician reassigned successfully' });
      setShowConfirm(false);
      setReassignOpId(null);
      refetch();
    } catch {
      addNotification({ type: 'error', title: 'Reassignment Failed', message: 'Failed to reassign technician' });
    } finally {
      setReassigning(false);
    }
  };

  const reassignOp = reassignOpId ? operations.find(o => o.id === reassignOpId) : undefined;
  const newTech = technicians.find(t => t.id === confirmData.newTechId);

  return (
    <PermissionGuard permission={OPERATIONS_CENTER_PERMISSIONS.VIEW_ASSIGNMENTS} fallback={
      <div style={{ padding: 24, textAlign: 'center', color: '#f87171' }}>
        <h2>Permission Denied</h2>
        <p>You do not have permission to view the Assignment Board.</p>
      </div>
    }>
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Assignment Board</h1>

        {reassignOpId && reassignOp && (
          <PermissionGuard permission={OPERATIONS_CENTER_PERMISSIONS.REASSIGN_TECHNICIAN}>
            <Card variant="bordered" style={{ padding: 20, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#e6ecf5' }}>Reassign Technician</h3>
              <ReassignTechnicianForm
                operation={reassignOp}
                technicians={technicians}
                onSubmit={(opId, currId, newId, reason) => submitReassign(opId, currId, newId, reason)}
                onCancel={() => setReassignOpId(null)}
              />
            </Card>
          </PermissionGuard>
        )}

        <Card variant="bordered" style={{ marginBottom: 16 }}>
          <div style={{ padding: 12 }}>
            <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search assignments..." aria-label="Search assignments" />
          </div>
        </Card>

        <AssignmentQueueTable
          operations={paged}
          loading={loading}
          error={error}
          onRetry={refetch}
          onOperationClick={(id) => handleReassign(id)}
          selectedIds={selectedOperationIds}
          onToggleSelect={toggleOperationSelection}
        />

        {totalPages > 1 && (
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <ReassignmentConfirmationDialog
        open={showConfirm}
        operation={reassignOp}
        newTechnician={newTech}
        reason={confirmData.reason}
        onConfirm={confirmReassign}
        onCancel={() => setShowConfirm(false)}
        loading={reassigning}
      />
    </PermissionGuard>
  );
};
