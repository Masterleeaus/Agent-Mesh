import React from 'react';

interface SlippingAlertBannerProps {
  count: number;
  onViewClick?: () => void;
}

export function SlippingAlertBanner({ count, onViewClick }: SlippingAlertBannerProps) {
  if (count === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        backgroundColor: '#450a0a',
        border: '1px solid #991b1b',
        borderRadius: 8,
      }}
    >
      <span style={{ fontSize: 18, color: '#ef4444', flexShrink: 0 }}>&#9888;</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#fca5a5' }}>
          {count} {count === 1 ? 'followup is' : 'followups are'} overdue
        </span>
        <span style={{ fontSize: 13, color: '#fca5a5', marginLeft: 4 }}>— immediate attention required.</span>
      </div>
      {onViewClick && (
        <button
          onClick={onViewClick}
          style={{
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 600,
            color: '#fca5a5',
            backgroundColor: 'transparent',
            border: '1px solid #991b1b',
            borderRadius: 6,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#7f1d1d'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          View
        </button>
      )}
    </div>
  );
}
