import { memo, type FC } from 'react';

interface KpiCardProps {
  title: string;
  count: number;
  variant: 'accent' | 'warn' | 'bad';
}

const KpiCard: FC<KpiCardProps> = ({ title, count, variant }) => (
  <div
    style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius)',
      padding: '16px 20px',
      border: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}
  >
    <span
      style={{
        fontSize: 12,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      {title}
    </span>
    <span
      style={{
        fontSize: 32,
        fontWeight: 700,
        color: `var(--${variant})`,
      }}
    >
      {count}
    </span>
  </div>
);

interface KpiCardsProps {
  todayCount: number;
  unassignedCount: number;
  followupCount: number;
}

const KpiCards: FC<KpiCardsProps> = ({
  todayCount,
  unassignedCount,
  followupCount,
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 16,
      marginBottom: 24,
    }}
  >
    <KpiCard title="Today" count={todayCount} variant="accent" />
    <KpiCard title="Unassigned" count={unassignedCount} variant="warn" />
    <KpiCard title="Needs follow-up" count={followupCount} variant="bad" />
  </div>
);

export default memo(KpiCards);
