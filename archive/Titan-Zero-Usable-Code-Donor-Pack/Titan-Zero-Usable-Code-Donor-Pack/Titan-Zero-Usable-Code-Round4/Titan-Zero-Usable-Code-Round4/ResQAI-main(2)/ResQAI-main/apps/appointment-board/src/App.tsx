import type { FC } from 'react';
import { AppStateContext } from './state/atoms';
import { useAppointments } from './hooks/useAppointments';
import { AppointmentBoardPage } from './routes';
import './App.css';

const App: FC = () => {
  const state = useAppointments();

  return (
    <AppStateContext.Provider value={state}>
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <header
          style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border)',
            padding: '0 24px',
            height: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span
            style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}
          >
            ResQAI
          </span>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Appointment Board
          </span>
        </header>
        <main>
          <AppointmentBoardPage />
        </main>
      </div>
    </AppStateContext.Provider>
  );
};

export default App;
