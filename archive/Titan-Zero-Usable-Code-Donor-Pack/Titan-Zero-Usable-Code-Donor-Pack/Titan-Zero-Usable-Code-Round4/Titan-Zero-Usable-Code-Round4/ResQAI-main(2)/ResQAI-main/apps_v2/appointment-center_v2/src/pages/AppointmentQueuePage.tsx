import { useState } from 'react';
import { Card, SearchBar, Filter, Pagination, Button, Skeleton, EmptyState, ErrorState } from '../../../shared/src/components';
import { AppointmentQueueTable } from '../components';
import { useAppointments } from '../hooks';
import { useAppContext } from '../state';

const filterGroups = [
  {
    id: 'status', label: 'Status',
    options: [
      { value: 'scheduled', label: 'Scheduled' },
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'no_show', label: 'No Show' },
      { value: 'rescheduled', label: 'Rescheduled' },
    ],
  },
  {
    id: 'type', label: 'Type',
    options: [
      { value: 'standard', label: 'Standard' },
      { value: 'emergency', label: 'Emergency' },
      { value: 'follow_up', label: 'Follow Up' },
      { value: 'recurring', label: 'Recurring' },
    ],
  },
];

export function AppointmentQueuePage() {
  const { selectedAppointmentIds, toggleAppointmentSelection, clearSelection } = useAppContext();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filterParams = { page, pageSize: 25, search, sortBy, sortOrder, ...filterValues };
  const { appointments, total, loading, error, refetch } = useAppointments(filterParams);
  const totalPages = Math.max(1, Math.ceil(total / 25));

  const handleFilterChange = (groupId: string, value: string, checked: boolean) => {
    setFilterValues(prev => ({
      ...prev,
      [groupId]: checked ? [...(prev[groupId] || []), value] : (prev[groupId] || []).filter(v => v !== value),
    }));
    setPage(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Appointment Queue</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{total} appointment{total !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => window.location.hash = '#/appointments/new'}>+ New Appointment</Button>
      </div>

      {selectedAppointmentIds.length > 0 && (
        <Card variant="bordered" padding="sm" style={{ background: '#1e2a4a', borderColor: '#3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 8px' }}>
            <span style={{ fontSize: 13, color: '#e2e8f0' }}>{selectedAppointmentIds.length} selected</span>
            <Button size="sm" variant="outline" onClick={() => window.location.hash = '#/appointments/new'}>Batch Assign</Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>Clear Selection</Button>
          </div>
        </Card>
      )}

      <Card variant="elevated" padding="md">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search by customer, service, or technician..." />
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                padding: '6px 8px', borderRadius: 6, border: '1px solid #334155',
                background: '#1a2332', color: '#e2e8f0', fontSize: 12,
              }}
            >
              <option value="date">Date</option>
              <option value="customerName">Customer</option>
              <option value="status">Status</option>
            </select>
            <button
              onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
              style={{
                padding: '6px 8px', borderRadius: 6, border: '1px solid #334155',
                background: '#1a2332', color: '#e2e8f0', fontSize: 12, cursor: 'pointer',
              }}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ width: 200, flexShrink: 0 }}>
            <Filter
              groups={filterGroups}
              values={filterValues}
              onChange={handleFilterChange}
              onClear={() => setFilterValues({})}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div>
                <Skeleton variant="rectangular" height={40} style={{ marginBottom: 8 }} />
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
              </div>
            ) : error ? (
              <ErrorState title="Failed to load appointments" message={error} onRetry={refetch} />
            ) : (
              <AppointmentQueueTable
                appointments={appointments}
                loading={false}
                error={null}
                onRowClick={id => window.location.hash = `#/appointments/${id}`}
                emptyMessage="No appointments match your filters."
              />
            )}
            {totalPages > 1 && (
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
