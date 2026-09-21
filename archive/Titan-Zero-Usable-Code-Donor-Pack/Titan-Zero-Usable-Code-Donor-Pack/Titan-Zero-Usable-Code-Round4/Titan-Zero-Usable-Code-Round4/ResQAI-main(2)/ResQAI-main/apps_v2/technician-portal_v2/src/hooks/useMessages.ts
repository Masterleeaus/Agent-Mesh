import { useState, useEffect, useCallback } from 'react';
import type { MessageVM } from '../models/view-models';
import { technicianService } from '../services/technician-service';

interface UseMessagesResult {
  messages: MessageVM[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  sendMessage: (body: string) => Promise<void>;
}

export function useMessages(jobId: string): UseMessagesResult {
  const [messages, setMessages] = useState<MessageVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await technicianService.getMessages(jobId);
      setMessages(res.map(m => ({
        id: m.id, senderId: m.senderId, senderName: m.senderName,
        senderRole: m.senderRole as 'technician' | 'dispatcher' | 'operations' | 'system',
        body: m.body, read: m.read, createdAt: m.createdAt,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  const sendMessage = useCallback(async (body: string) => {
    await technicianService.sendMessage(jobId, { body });
    await fetch();
  }, [jobId, fetch]);

  useEffect(() => { fetch(); }, [fetch]);

  return { messages, loading, error, refetch: fetch, sendMessage };
}
