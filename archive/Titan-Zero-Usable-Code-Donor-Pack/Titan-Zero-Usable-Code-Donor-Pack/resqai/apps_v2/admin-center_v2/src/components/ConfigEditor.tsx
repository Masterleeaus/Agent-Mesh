import { useState, type FC } from 'react';
import { Input, Button } from '@resqai/foundation';

const rowStyle: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' };

export const ConfigEditor: FC<{ pairs: Record<string, string>; onChange: (pairs: Record<string, string>) => void }> = ({ pairs, onChange }) => {
  const [entries, setEntries] = useState(Object.entries(pairs));

  const update = (idx: number, field: 'key' | 'value', val: string) => {
    const next = entries.map((e, i) => i === idx ? (field === 'key' ? [val, e[1]] : [e[0], val]) : e) as [string, string][];
    setEntries(next);
    onChange(Object.fromEntries(next));
  };

  const add = () => { setEntries([...entries, ['', '']]); };
  const remove = (idx: number) => { const next = entries.filter((_, i) => i !== idx); setEntries(next); onChange(Object.fromEntries(next)); };

  return (
    <div>
      {entries.map(([k, v], i) => (
        <div key={i} style={rowStyle}>
          <Input value={k} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(i, 'key', e.target.value)} placeholder="Key" style={{ flex: 1 }} />
          <Input value={v} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(i, 'value', e.target.value)} placeholder="Value" style={{ flex: 1 }} />
          <Button size="sm" variant="ghost" onClick={() => remove(i)}>✕</Button>
        </div>
      ))}
      <Button size="sm" variant="secondary" onClick={add}>+ Add Entry</Button>
    </div>
  );
};
