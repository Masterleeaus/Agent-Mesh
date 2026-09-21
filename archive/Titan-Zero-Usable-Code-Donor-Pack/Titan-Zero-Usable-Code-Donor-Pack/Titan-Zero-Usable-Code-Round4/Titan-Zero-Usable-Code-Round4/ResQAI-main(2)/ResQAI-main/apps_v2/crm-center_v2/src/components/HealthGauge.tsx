import React from 'react';

interface HealthGaugeProps {
  score: number;
  size?: number;
  label?: string;
}

function getScoreColor(score: number): string {
  if (score > 80) return '#16a34a';
  if (score >= 50) return '#d97706';
  if (score >= 25) return '#f97316';
  return '#dc2626';
}

function getScoreLabel(score: number): string {
  if (score > 80) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 25) return 'At Risk';
  return 'Critical';
}

export function HealthGauge({ score, size = 120, label }: HealthGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const color = getScoreColor(clamped);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#334155" strokeWidth={8} />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
        />
        <text x="50" y="52" textAnchor="middle" dominantBaseline="central" fontSize={22} fontWeight={700} fill="#e6ecf5">
          {clamped}
        </text>
      </svg>
      {label && <span style={{ fontSize: 12, color: '#8b9bb5' }}>{label}</span>}
      <span style={{ fontSize: 11, fontWeight: 600, color }}>{getScoreLabel(clamped)}</span>
    </div>
  );
}
