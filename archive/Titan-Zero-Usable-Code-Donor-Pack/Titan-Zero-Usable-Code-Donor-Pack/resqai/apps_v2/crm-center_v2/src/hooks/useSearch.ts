import { useState, useCallback } from 'react';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ type: string; id: string; label: string; sublabel?: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    setQuery(q);
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    setResults([
      { type: 'Account', id: 'acc-1', label: 'Acme Corp', sublabel: 'Alice Johnson · Healthy' },
      { type: 'Account', id: 'acc-2', label: 'Globex Inc', sublabel: 'Bob Smith · Watch' },
      { type: 'Customer', id: 'c-1', label: 'Alice Johnson', sublabel: 'alice@example.com' },
      { type: 'Followup', id: 'fu-1', label: 'Quarterly review', sublabel: 'Due Jul 10 · High' },
      { type: 'Task', id: 'task-1', label: 'Prepare Q3 proposal', sublabel: 'Sarah Connor · In Progress' },
      { type: 'Opportunity', id: 'opp-1', label: 'Annual service contract renewal', sublabel: '$45,000 · Negotiation' },
    ]);
    setLoading(false);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  return { query, results, loading, search, clear };
}
