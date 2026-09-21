import { Skeleton } from '../../../shared/src/components';
import type { TimeSlotDTO } from '../models/dto';

interface TimeSlotPickerProps {
  slots: TimeSlotDTO[];
  selected?: string;
  onSelect: (slot: TimeSlotDTO) => void;
  loading?: boolean;
}

const gridStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8,
};

export function TimeSlotPicker({ slots, selected, onSelect, loading }: TimeSlotPickerProps) {
  if (loading) {
    return (
      <div style={gridStyle}>
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="text" height={40} />)}
      </div>
    );
  }

  return (
    <div style={gridStyle}>
      {slots.map(slot => (
        <button
          key={slot.start}
          disabled={!slot.available}
          onClick={() => onSelect(slot)}
          style={{
            padding: '10px 12px', borderRadius: 6, border: '1px solid #334155',
            background: selected === slot.start ? '#41d1c4' : slot.available ? '#1a2332' : '#111827',
            color: selected === slot.start ? '#0b1220' : slot.available ? '#e2e8f0' : '#475569',
            cursor: slot.available ? 'pointer' : 'not-allowed',
            fontWeight: selected === slot.start ? 600 : 400,
            fontSize: 13, opacity: slot.available ? 1 : 0.5,
          }}
        >
          {slot.label}
        </button>
      ))}
    </div>
  );
}
