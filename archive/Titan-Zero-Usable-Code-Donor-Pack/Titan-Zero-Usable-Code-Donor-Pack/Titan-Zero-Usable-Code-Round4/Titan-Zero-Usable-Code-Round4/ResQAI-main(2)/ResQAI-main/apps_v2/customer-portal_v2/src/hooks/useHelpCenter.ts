import { useState, useEffect } from 'react';
import { CustomerService } from '../services/customer-service';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

interface UseHelpCenterResult {
  faqs: FAQItem[];
  loading: boolean;
  error: string | null;
}

export function useHelpCenter(): UseHelpCenterResult {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    CustomerService.getHelpCenterFAQs()
      .then((result) => { if (!cancelled) setFaqs(result); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load help center'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { faqs, loading, error };
}