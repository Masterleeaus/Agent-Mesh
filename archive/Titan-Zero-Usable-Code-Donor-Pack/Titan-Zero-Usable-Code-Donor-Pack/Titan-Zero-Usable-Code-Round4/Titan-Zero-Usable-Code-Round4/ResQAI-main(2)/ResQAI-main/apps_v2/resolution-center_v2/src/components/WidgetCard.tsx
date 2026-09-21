import { type FC, type ReactNode } from 'react';
import { Card } from '@resqai/foundation';

interface WidgetCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  variant?: 'default' | 'warning' | 'danger' | 'success';
}

export const WidgetCard: FC<WidgetCardProps> = ({ title, value, subtitle, icon, trend, trendLabel, variant = 'default' }) => {
  const accentColor = variant === 'danger' ? '#f04438' : variant === 'warning' ? '#f79009' : variant === 'success' ? '#12b76a' : '#41d1c4';

  return (
    <Card variant="bordered" style={{ padding: 16, borderTop: `3px solid ${accentColor}`, minWidth: 200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: '#8b9bb5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
          <p style={{ margin: '8px 0', fontSize: 28, fontWeight: 700, color: '#e6ecf5' }}>{value}</p>
          {subtitle && <p style={{ margin: 0, fontSize: 12, color: '#6b7b95' }}>{subtitle}</p>}
          {trend && trendLabel && (
            <p style={{ margin: '4px 0 0', fontSize: 11, color: trend === 'up' ? '#12b76a' : trend === 'down' ? '#f04438' : '#8b9bb5' }}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendLabel}
            </p>
          )}
        </div>
        {icon && <div style={{ color: accentColor, fontSize: 24 }}>{icon}</div>}
      </div>
    </Card>
  );
};
