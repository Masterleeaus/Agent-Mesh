import { useState, type FC } from 'react';
import { Card, Button, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import { technicianService } from '../services/technician-service';
import { useAppContext } from '../state/AppContext';
import type { MessageDTO } from '../models/dto';
import type { JobDTO } from '../models/dto';
import { mockJobs, mockMessages } from '../services/mock-data';

export const MessagesPage: FC = () => {
  const { addNotification } = useAppContext();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const todayJobs = mockJobs.filter(j => j.scheduledDate === new Date().toISOString().split('T')[0]);

  const loadMessages = async (jobId: string) => {
    setSelectedJobId(jobId);
    setLoading(true);
    setError(null);
    try {
      const res = await technicianService.getMessages(jobId);
      setMessages(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedJobId || !newMessage.trim()) return;
    setSending(true);
    try {
      await technicianService.sendMessage(selectedJobId, { body: newMessage.trim() });
      setNewMessage('');
      const res = await technicianService.getMessages(selectedJobId);
      setMessages(res);
    } catch {
      addNotification({ type: 'error', title: 'Failed to send', message: 'Could not send message.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ padding: 24, display: 'flex', gap: 24, height: 'calc(100vh - 120px)' }}>
      <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Messages</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'auto', flex: 1 }}>
          {todayJobs.map(job => {
            const jobMessages = mockMessages[job.id] || [];
            const unread = jobMessages.filter(m => !m.read).length;
            return (
              <Card
                key={job.id}
                variant={selectedJobId === job.id ? 'filled' : 'bordered'}
                onClick={() => loadMessages(job.id)}
                style={{ cursor: 'pointer', padding: 12 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e6ecf5' }}>{job.title}</span>
                  {unread > 0 && (
                    <span style={{
                      background: '#41d1c4', color: '#0b1220', fontSize: 11,
                      padding: '1px 6px', borderRadius: 10, fontWeight: 700,
                    }}>{unread}</span>
                  )}
                </div>
                <span style={{ fontSize: 11, color: '#8b9bb5' }}>{job.customerName}</span>
              </Card>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {!selectedJobId ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <EmptyState title="Select a job" description="Select a job from the list to view messages." />
          </div>
        ) : loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Skeleton variant="rectangular" height={400} />
          </div>
        ) : error ? (
          <ErrorState title="Failed to load messages" message={error} onRetry={() => loadMessages(selectedJobId)} />
        ) : (
          <>
            <div style={{ flex: 1, overflow: 'auto', marginBottom: 12 }}>
              {messages.length === 0 ? (
                <EmptyState title="No messages" description="No messages for this job yet." size="sm" />
              ) : (
                messages.map(msg => (
                  <div key={msg.id} style={{
                    display: 'flex', marginBottom: 12,
                    justifyContent: msg.senderRole === 'technician' ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      maxWidth: '70%', padding: '10px 14px', borderRadius: 12,
                      background: msg.senderRole === 'technician' ? '#1a3a4a' : '#1a2744',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#41d1c4' }}>{msg.senderName}</span>
                        <span style={{ fontSize: 10, color: '#5a6a85' }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: '#e6ecf5', lineHeight: 1.4 }}>{msg.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Type a message..."
                style={{
                  flex: 1, padding: '10px 14px', background: '#131c2f', color: '#e6ecf5',
                  border: '1px solid #243049', borderRadius: 8, fontSize: 13,
                  fontFamily: 'inherit',
                }}
                aria-label="Message input"
              />
              <Button onClick={sendMessage} disabled={!newMessage.trim() || sending} loading={sending}>Send</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
