import React from 'react';
import type { HealthScanResultVM } from '../models';

interface HealthScanResultCardProps {
  scan: HealthScanResultVM;
}

const statusColors: Record<string, string> = {
  completed: '#16a34a',
  running: '#3b82f6',
  failed: '#ef4444',
};

export function HealthScanResultCard({ scan }: HealthScanResultCardProps) {
  const statusColor = statusColors[scan.status] || '#64748b';

  return (
    <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e6ecf5' }}>
          Scan &middot; {new Date(scan.scanDate).toLocaleDateString()}
        </span>
        <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, backgroundColor: `${statusColor}22`, color: statusColor, textTransform: 'capitalize' }}>
          {scan.status}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 8 }}>
        Triggered by: <span style={{ color: '#8b9bb5' }}>{scan.triggeredBy}</span>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center', minWidth: 50 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#e6ecf5' }}>{scan.accountsScanned}</div>
          <div style={{ fontSize: 10, color: '#8b9bb5' }}>Scanned</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 50 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>{scan.criticalCount}</div>
          <div style={{ fontSize: 10, color: '#8b9bb5' }}>Critical</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 50 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f97316' }}>{scan.slippingCount}</div>
          <div style={{ fontSize: 10, color: '#8b9bb5' }}>Slipping</div>
        </div>
      </div>
    </div>
  );
}
