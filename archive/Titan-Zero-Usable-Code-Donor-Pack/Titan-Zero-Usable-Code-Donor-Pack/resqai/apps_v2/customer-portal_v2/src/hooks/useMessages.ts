import { useState, useEffect, useCallback } from 'react';
import { CustomerService } from '../services/customer-service';
import type { MessageListItemVM, MessageDTO } from '../models/dto';

interface UseMessagesResult {
  data: MessageListItemVM[];
  total: number;
  loading: boolean;
  error: string | null;
}

interface UseTicketMessagesResult {
  data: MessageDTO[];
  loading: boolean;
  error: string | null;
  sendMessage: (body: string) => Promise<void>;
}

export function useMessages(page: number = 1): UseMessagesResult {
  const [data, setData] = useState<MessageListItemVM[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback((p: number = page) => {
    setLoading(true);
    setError(null);
    CustomerService.listMessages(p)
      .then((result) => { setData(result.messages); setTotal(result.total); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load messages'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error };
}

export function useTicketMessages(ticketId: string): UseTicketMessagesResult {
  const [data, setData] = useState<MessageDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    CustomerService.getTicketMessages(ticketId)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load messages'))
      .finally(() => setLoading(false));
  }, [ticketId]);

  useEffect(() => { fetch(); }, [fetch]);

  const sendMessage = useCallback(async (body: string) => {
    const msg = await CustomerService.sendMessage({ ticketId, body });
    setData((prev) => [...prev, msg]);
  }, [ticketId]);

  return { data, loading, error, sendMessage };
}