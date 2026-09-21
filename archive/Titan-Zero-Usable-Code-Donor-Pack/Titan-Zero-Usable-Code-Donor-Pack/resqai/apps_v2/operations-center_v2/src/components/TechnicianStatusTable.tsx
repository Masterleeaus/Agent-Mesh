import { type FC } from 'react';
import type { TechnicianDTO } from '../models/dto';
import { Skeleton, EmptyState } from '@resqai/foundation';

interface TechnicianStatusTableProps {
  technicians: TechnicianDTO[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onTechnicianClick: (id: string) => void;
}

const statusColors: Record<string, string> = {
  available: '#4ade80',
  en_route: '#60a5fa',
  on_site: '#f59e0b',
  on_break: '#a78bfa',
  offline: '#6b7280',
  completed: '#4ade80',
};

export const TechnicianStatusTable: FC<TechnicianStatusTableProps> = ({ technicians, loading, error, onRetry, onTechnicianClick }) => {
  if (loading) {
    return (
      <div role="status" aria-label="Loading technician status">
        <Skeleton variant="rectangular" height={40} style={{ marginBottom: 8 }} />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" style={{ padding: 24, textAlign: 'center', color: '#f87171' }}>
        <p>{error}</p>
        <button onClick={onRetry} style={{ background: 'none', border: '1px solid #f87171', color: '#f87171', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  if (technicians.length === 0) {
    return <EmptyState title="No Technicians" message="No technicians available." />;
  }

  return (
    <div role="region" aria-label="Technician status table" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #243049', color: '#8b9bb5' }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Name</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Status</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Region</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Current Job</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Jobs</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Rating</th>
          </tr>
        </thead>
        <tbody>
          {technicians.map((tech) => (
            <tr
              key={tech.id}
              style={{ borderBottom: '1px solid #1a2744', cursor: 'pointer' }}
              onClick={() => onTechnicianClick(tech.id)}
              role="row"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onTechnicianClick(tech.id); }}
            >
              <td style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: '#243049',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#8b9bb5', fontSize: 12, fontWeight: 600,
                  }}>
                    {tech.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span style={{ color: '#e6ecf5', fontWeight: 500 }}>{tech.name}</span>
                </div>
              </td>
              <td style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[tech.status] || '#6b7280' }} />
                  <span style={{ color: statusColors[tech.status] || '#8b9bb5', fontSize: 12, textTransform: 'capitalize' }}>{tech.status.replace('_', ' ')}</span>
                </div>
              </td>
              <td style={{ padding: '10px 12px', color: '#8b9bb5', textTransform: 'capitalize' }}>{tech.region}</td>
              <td style={{ padding: '10px 12px', color: '#c8d0dc' }}>{tech.currentOperationId || '\u2014'}</td>
              <td style={{ padding: '10px 12px', color: '#8b9bb5' }}>{tech.completedJobs}</td>
              <td style={{ padding: '10px 12px', color: '#f59e0b' }}>{'\u2605'} {tech.rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
