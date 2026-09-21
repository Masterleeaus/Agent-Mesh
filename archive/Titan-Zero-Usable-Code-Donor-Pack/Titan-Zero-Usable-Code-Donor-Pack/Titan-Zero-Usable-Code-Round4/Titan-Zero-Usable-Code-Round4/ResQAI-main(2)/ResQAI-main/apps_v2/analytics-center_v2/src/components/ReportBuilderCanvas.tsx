import { Card } from '../../../../shared/src/components';

interface ReportBuilderCanvasProps {
  onDrop?: (item: string) => void;
  children?: React.ReactNode;
}

export function ReportBuilderCanvas({ children }: ReportBuilderCanvasProps) {
  return (
    <Card
      padding="lg"
      variant="bordered"
      style={{
        background: '#131c2f',
        border: '2px dashed #243049',
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children || (
        <div style={{ textAlign: 'center', color: '#6b7a95' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{'\u2B55'}</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Report Canvas</div>
          <div style={{ fontSize: 12 }}>Drag chart components here to build your report</div>
        </div>
      )}
    </Card>
  );
}
