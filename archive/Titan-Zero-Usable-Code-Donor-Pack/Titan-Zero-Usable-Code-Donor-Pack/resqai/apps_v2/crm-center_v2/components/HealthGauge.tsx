import type { FC } from 'react';

interface HealthGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

function gaugeColor(score: number): string {
  if (score >= 80) return '#41d1c4';
  if (score >= 50) return '#f59e0b';
  if (score >= 30) return '#f97316';
  return '#ef4444';
}

export const HealthGauge: FC<HealthGaugeProps> = ({ score, size = 120, strokeWidth = 10 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const color = gaugeColor(score);

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#243049" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: size * 0.28, fontWeight: 700, color: '#e6ecf5', lineHeight: 1 }}>{Math.round(score)}</span>
        <span style={{ fontSize: size * 0.1, color: '#8b9bb5', marginTop: 2 }}>score</span>
      </div>
    </div>
  );
};
