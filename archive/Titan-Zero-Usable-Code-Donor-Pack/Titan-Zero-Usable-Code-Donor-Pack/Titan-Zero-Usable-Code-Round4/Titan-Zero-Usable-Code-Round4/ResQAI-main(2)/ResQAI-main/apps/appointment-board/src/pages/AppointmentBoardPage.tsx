import { useCallback, type FC } from 'react';
import { useAppState } from '../state/atoms';
import KpiCards from '../components/KpiCards';
import AppointmentGroup from '../components/AppointmentGroup';
import AppointmentDetail from '../components/AppointmentDetail';

const AppointmentBoardPage: FC = () => {
  const {
    loading,
    error,
    todayCount,
    unassignedCount,
    followupCount,
    groups,
    selectedAppointment,
    technicians,
    suggestion,
    suggesting,
    selectAppointment,
    updateStatus,
    assignTech,
    suggestTech,
    clearSuggestion,
    refresh,
  } = useAppState();

  const handleAssignTech = useCallback(
    (techId: string, techName: string) => {
      if (selectedAppointment) assignTech(selectedAppointment.id, techId, techName);
    },
    [selectedAppointment, assignTech],
  );

  const handleUpdateStatus = useCallback(
    (status: string) => {
      if (selectedAppointment) updateStatus(selectedAppointment.id, status);
    },
    [selectedAppointment, updateStatus],
  );

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '60vh',
          color: 'var(--text-muted)',
        }}
      >
        Loading appointments\u2026
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <div style={{ color: 'var(--bad)', marginBottom: 16 }}>{error}</div>
        <button
          onClick={refresh}
          style={{
            padding: '8px 20px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            margin: 0,
            color: 'var(--text-primary)',
          }}
        >
          Appointment Board
        </h1>
        <button
          onClick={refresh}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Refresh
        </button>
      </div>

      <KpiCards
        todayCount={todayCount}
        unassignedCount={unassignedCount}
        followupCount={followupCount}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedAppointment ? '1fr 380px' : '1fr',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <div>
          {groups.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: 48,
                color: 'var(--text-muted)',
              }}
            >
              No appointments found.
            </div>
          )}
          {groups.map((g) => (
            <AppointmentGroup
              key={g.section}
              title={g.title}
              items={g.items}
              selectedId={selectedAppointment?.id || null}
              onSelect={selectAppointment}
            />
          ))}
        </div>

        {selectedAppointment && (
          <AppointmentDetail
            appointment={selectedAppointment}
            technicians={technicians}
            suggestion={suggestion}
            suggesting={suggesting}
            onAssignTech={handleAssignTech}
            onSuggestTech={suggestTech}
            onUpdateStatus={handleUpdateStatus}
            onClearSuggestion={clearSuggestion}
          />
        )}
      </div>
    </div>
  );
};

export default AppointmentBoardPage;
