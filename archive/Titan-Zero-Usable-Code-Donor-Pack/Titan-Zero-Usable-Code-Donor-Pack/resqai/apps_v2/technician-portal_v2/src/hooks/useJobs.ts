import { useState, useEffect, useCallback } from 'react';
import type { JobListItemVM } from '../models/view-models';
import type { JobListFilters } from '../models/api-requests';
import { technicianService } from '../services/technician-service';

interface UseJobsResult {
  jobs: JobListItemVM[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useJobs(filters?: JobListFilters): UseJobsResult {
  const [jobs, setJobs] = useState<JobListItemVM[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await technicianService.listJobs(filters);
      setJobs(res.data.map(j => ({
        id: j.id, title: j.title, customerName: j.customerName,
        customerAddress: j.customerAddress, serviceType: j.serviceType,
        priority: j.priority, status: j.status,
        scheduledStart: j.scheduledStart, scheduledEnd: j.scheduledEnd,
        estimatedDuration: j.estimatedDuration,
        isUrgent: j.priority === 'urgent',
        isEscalated: j.status === 'escalated',
        latitude: j.latitude, longitude: j.longitude,
        travelDistance: j.travelDistance, travelDuration: j.travelDuration,
      })));
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  return { jobs, total, loading, error, refetch: fetch };
}
