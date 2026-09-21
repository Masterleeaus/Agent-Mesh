import { useState, useEffect, type FC } from 'react';

interface SLAStopwatchProps {
  deadline: string;
  onBreach?: () => void;
}

function getRemainingSeconds(deadline: string): number {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const SLAStopwatch: FC<SLAStopwatchProps> = ({ deadline, onBreach }) => {
  const [remaining, setRemaining] = useState(() => getRemainingSeconds(deadline));

  useEffect(() => {
    const id = setInterval(() => {
      const rem = getRemainingSeconds(deadline);
      setRemaining(rem);
      if (rem <= 0 && onBreach) onBreach();
    }, 1000);
    return () => clearInterval(id);
  }, [deadline, onBreach]);

  const isBreached = remaining <= 0;
  const isWarning = remaining > 0 && remaining < 3600;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
      color: isBreached ? '#f87171' : isWarning ? '#fbbf24' : '#4ade80',
    }}>
      {isBreached ? 'BREACHED' : formatTime(remaining)}
    </span>
  );
};
