import { useState, type FC } from 'react';
import { Card, SearchBar, Button, Pagination } from '@resqai/foundation';
import { DispatchQueueTable, PermissionGuard } from '../components';
import { useDispatchQueue } from '../hooks/useDispatchQueue';
import { useTechnicians } from '../hooks/useTechnicians';
import { useAppContext } from '../state/AppContext';
import { OPERATIONS_CENTER_PERMISSIONS } from '../contracts/permissions';
import { ManualDispatchForm } from '../components/ManualDispatchForm';
import { DispatchConfirmationDialog } from '../components/DispatchConfirmationDialog';
import { operationsService } from '../services/operations-service';

export const DispatchQueuePage: FC = () => {
  const { selectedOperationIds, toggleOperationSelection, clearSelection, addNotification } = useAppContext();
  const { pendingOperations, loading, error, refetch } = useDispatchQueue();
  const { technicians } = useTechnicians();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [dispatchOpId, setDispatchOpId] = useState('');
  const [dispatchTechId, setDispatchTechId] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  const filtered = pendingOperations.filter(op => {
    if (!search) return true;
    const q = search.toLowerCase();
    return op.title.toLowerCase().includes(q) || op.customerName.toLowerCase().includes(q) || op.id.toLowerCase().includes(q);
  });

  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDispatch = (opId: string, techId: string, notes: string) => {
    setDispatchOpId(opId);
    setDispatchTechId(techId);
    setShowConfirm(true);
  };

  const confirmDispatch = async () => {
    setDispatching(true);
    try {
      await operationsService.dispatch({ operationId: dispatchOpId, technicianId: dispatchTechId, method: 'manual' });
      addNotification({ type: 'success', title: 'Dispatched', message: 'Operation dispatched successfully' });
      setShowConfirm(false);
      setShowForm(false);
      refetch();
    } catch {
      addNotification({ type: 'error', title: 'Dispatch Failed', message: 'Failed to dispatch operation' });
    } finally {
      setDispatching(false);
    }
  };

  const selectedOp = pendingOperations.find(op => op.id === dispatchOpId);
  const selectedTech = technicians.find(t => t.id === dispatchTechId);

  return (
    <PermissionGuard permission={OPERATIONS_CENTER_PERMISSIONS.VIEW_DISPATCH_QUEUE} fallback={
      <div style={{ padding: 24, textAlign: 'center', color: '#f87171' }}>
        <h2>Permission Denied</h2>
        <p>You do not have permission to view the Dispatch Queue.</p>
      </div>
    }>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Dispatch Queue</h1>
          <PermissionGuard permission={OPERATIONS_CENTER_PERMISSIONS.CREATE_DISPATCH}>
            <Button onClick={() => setShowForm(!showForm)} aria-label="Manual dispatch">
              {showForm ? 'Cancel' : '+ Manual Dispatch'}
            </Button>
          </PermissionGuard>
        </div>

        {showForm && (
          <Card variant="bordered" style={{ padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#e6ecf5' }}>Manual Dispatch</h3>
            <ManualDispatchForm
              operations={pendingOperations}
              technicians={technicians}
              onSubmit={handleDispatch}
              onCancel={() => setShowForm(false)}
            />
          </Card>
        )}

        <Card variant="bordered" style={{ marginBottom: 16 }}>
          <div style={{ padding: 12 }}>
            <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search operations by ID, title, or customer..." aria-label="Search operations" />
          </div>
        </Card>

        <DispatchQueueTable
          operations={paged}
          loading={loading}
          error={error}
          onRetry={refetch}
          onOperationClick={(id) => { window.location.hash = `#/operations/${id}`; }}
          selectedIds={selectedOperationIds}
          onToggleSelect={toggleOperationSelection}
        />

        {totalPages > 1 && (
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <DispatchConfirmationDialog
        open={showConfirm}
        operation={selectedOp}
        technician={selectedTech}
        onConfirm={confirmDispatch}
        onCancel={() => setShowConfirm(false)}
        loading={dispatching}
      />
    </PermissionGuard>
  );
};
