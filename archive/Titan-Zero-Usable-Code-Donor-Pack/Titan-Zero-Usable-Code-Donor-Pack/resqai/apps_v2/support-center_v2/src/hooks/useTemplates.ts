import { useState, useEffect, useCallback } from 'react';
import type { TemplateDTO } from '../models/dto';
import { ticketService } from '../services/ticket-service';

interface UseTemplatesResult {
  templates: TemplateDTO[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTemplates(): UseTemplatesResult {
  const [templates, setTemplates] = useState<TemplateDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ticketService.getTemplates();
      setTemplates(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { templates, loading, error, refetch: fetch };
}
