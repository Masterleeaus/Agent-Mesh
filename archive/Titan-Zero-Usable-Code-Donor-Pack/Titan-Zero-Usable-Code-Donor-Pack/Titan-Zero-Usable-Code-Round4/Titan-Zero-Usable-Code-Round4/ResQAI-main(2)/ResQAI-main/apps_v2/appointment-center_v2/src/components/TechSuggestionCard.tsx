import { Card, Button, StatusBadge } from '../../../shared/src/components';
import type { TechSuggestionVM } from '../models/view-models';

interface TechSuggestionCardProps {
  suggestion: TechSuggestionVM;
  onSelect: (technicianId: string) => void;
}

export function TechSuggestionCard({ suggestion, onSelect }: TechSuggestionCardProps) {
  const { technician, confidence, matchReasons } = suggestion;

  return (
    <Card variant="elevated" padding="md" style={{ borderLeft: '3px solid #41d1c4' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>{technician.name}</div>
          <StatusBadge variant="success" size="sm">{Math.round(confidence * 100)}% match</StatusBadge>
        </div>
        <Button size="sm" variant="outline" onClick={() => onSelect(technician.id)}>Assign</Button>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
        <div>Skills: {technician.skills.join(', ')}</div>
        <div>Rating: ★ {technician.rating}</div>
        <div style={{ marginTop: 4, fontWeight: 500, color: '#41d1c4' }}>
          {matchReasons.map((r, i) => <div key={i}>✓ {r}</div>)}
        </div>
      </div>
    </Card>
  );
}
