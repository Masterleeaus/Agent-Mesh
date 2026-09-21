import { type FC } from 'react';
import { Skeleton, EmptyState } from '@resqai/foundation';
import type { MessageVM } from '../models/view-models';

interface MessageThreadProps {
  messages: MessageVM[];
  loading: boolean;
}

const messageContainerStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 12, padding: 16,
};

const customerStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  background: '#1a2744',
  borderRadius: '0 12px 12px 12px',
  padding: '10px 14px',
  maxWidth: '70%',
};

const agentStyle: React.CSSProperties = {
  alignSelf: 'flex-end',
  background: '#0d6e6b',
  borderRadius: '12px 0 12px 12px',
  padding: '10px 14px',
  maxWidth: '70%',
};

const systemStyle: React.CSSProperties = {
  alignSelf: 'center',
  background: '#243049',
  borderRadius: 8,
  padding: '6px 12px',
  maxWidth: '80%',
  fontSize: 12,
  fontStyle: 'italic',
};

export const MessageThread: FC<MessageThreadProps> = ({ messages, loading }) => {
  if (loading) {
    return <div style={{ padding: 16 }}>{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={60} style={{ marginBottom: 12 }} />)}</div>;
  }

  if (messages.length === 0) {
    return <EmptyState title="No messages" description="This ticket has no messages yet." size="sm" />;
  }

  return (
    <div style={messageContainerStyle}>
      {messages.map(msg => {
        const isCustomer = msg.authorRole === 'customer';
        const isSystem = msg.authorRole === 'system';
        return (
          <div key={msg.id} style={isSystem ? systemStyle : isCustomer ? customerStyle : agentStyle}>
            {!isSystem && <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: '#8b9bb5' }}>{msg.authorName}</div>}
            <p style={{ margin: 0, fontSize: 13, color: '#e6ecf5', whiteSpace: 'pre-wrap' }}>{msg.body}</p>
            <div style={{ fontSize: 10, color: '#6b7b95', marginTop: 4, textAlign: 'right' }}>{new Date(msg.createdAt).toLocaleTimeString()}</div>
          </div>
        );
      })}
    </div>
  );
};
