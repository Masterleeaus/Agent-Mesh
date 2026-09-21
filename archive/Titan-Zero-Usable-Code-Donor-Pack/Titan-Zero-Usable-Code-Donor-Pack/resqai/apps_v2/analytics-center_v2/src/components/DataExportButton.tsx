import { useState } from 'react';
import { Button, Dropdown } from '../../../../shared/src/components';
import type { ExportFormat } from '../models/dto';

interface DataExportButtonProps {
  onExport: (format: ExportFormat) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function DataExportButton({ onExport, loading, disabled }: DataExportButtonProps) {
  const [format, setFormat] = useState<ExportFormat>('csv' as ExportFormat);

  const exportFormats = [
    { value: 'csv' as ExportFormat, label: 'CSV' },
    { value: 'pdf' as ExportFormat, label: 'PDF' },
    { value: 'json' as ExportFormat, label: 'JSON' },
  ];

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Dropdown
        options={exportFormats}
        value={format}
        onChange={(v: ExportFormat) => setFormat(v)}
        size="sm"
      />
      <Button
        variant="secondary"
        size="sm"
        loading={loading}
        disabled={disabled}
        onClick={() => onExport(format)}
      >
        Export
      </Button>
    </div>
  );
}
