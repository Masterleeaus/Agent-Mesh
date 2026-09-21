import { useState, type FC } from 'react';
import { Button } from '@resqai/foundation';

interface ReplyEditorProps {
  onSubmit: (body: string) => void;
  submitting?: boolean;
  placeholder?: string;
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 100,
  padding: 10,
  borderRadius: 8,
  border: '1px solid #243049',
  background: '#131c2f',
  color: '#e6ecf5',
  fontSize: 13,
  resize: 'vertical',
  outline: 'none',
  boxSizing: 'border-box',
};

export const ReplyEditor: FC<ReplyEditorProps> = ({ onSubmit, submitting, placeholder = 'Draft a reply...' }) => {
  const [body, setBody] = useState('');

  const handleSubmit = () => {
    if (!body.trim()) return;
    onSubmit(body.trim());
    setBody('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder={placeholder}
        style={textareaStyle}
        rows={4}
        aria-label="Reply message"
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={handleSubmit} disabled={!body.trim()} loading={submitting}>
          Send Reply
        </Button>
      </div>
    </div>
  );
};
