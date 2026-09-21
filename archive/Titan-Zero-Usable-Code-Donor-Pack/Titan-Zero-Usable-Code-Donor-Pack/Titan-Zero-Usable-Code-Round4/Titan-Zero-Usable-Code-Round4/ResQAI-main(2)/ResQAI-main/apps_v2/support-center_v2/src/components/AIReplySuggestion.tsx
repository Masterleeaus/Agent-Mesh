import { type FC } from 'react';
import { Card, Button } from '@resqai/foundation';

interface AIReplySuggestionProps {
  suggestion: string;
  onAccept: () => void;
  onEdit: () => void;
  onReject: () => void;
  loading?: boolean;
  confidence?: number;
}

export const AIReplySuggestion: FC<AIReplySuggestionProps> = ({ suggestion, onAccept, onEdit, onReject, loading, confidence }) => {
  if (loading) return null;

  return (
    <Card variant="bordered" style={{ borderLeft: '3px solid #41d1c4', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#41d1c4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Suggestion</span>
          {confidence !== undefined && <span style={{ fontSize: 11, color: '#8b9bb5' }}>{(confidence * 100).toFixed(0)}% confidence</span>}
        </div>
      </div>
      <p style={{ margin: '0 0 10px', fontSize: 13, color: '#c8d0dc', whiteSpace: 'pre-wrap' }}>{suggestion}</p>
      <div style={{ display: 'flex', gap: 6 }}>
        <Button size="sm" variant="primary" onClick={onAccept}>Accept</Button>
        <Button size="sm" variant="outline" onClick={onEdit}>Edit</Button>
        <Button size="sm" variant="ghost" onClick={onReject}>Reject</Button>
      </div>
    </Card>
  );
};
