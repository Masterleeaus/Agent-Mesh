const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

const STATUS_ORDER: Record<string, number> = {
  open: 0,
  new: 0,
  classified: 1,
  drafted: 2,
  approved_to_send: 3,
  in_progress: 1,
  analyzing: 2,
  recommendation_ready: 3,
  approved: 4,
  rejected: 4,
  sent: 5,
  closed: 6,
  completed: 6,
  cancelled: 7,
};

export function sortByDate<T extends { created_at?: string; date?: string; due_date?: string }>(
  items: T[],
  field: 'created_at' | 'date' | 'due_date' = 'created_at',
  descending = true
): T[] {
  return [...items].sort((a, b) => {
    const da = a[field] ? new Date(a[field]!).getTime() : 0;
    const db = b[field] ? new Date(b[field]!).getTime() : 0;
    return descending ? db - da : da - db;
  });
}

export function sortByPriority<T extends { priority?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority ?? 'normal'] ?? 99;
    const pb = PRIORITY_ORDER[b.priority ?? 'normal'] ?? 99;
    return pa - pb;
  });
}

export function sortByStatus<T extends { status?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const sa = STATUS_ORDER[a.status ?? ''] ?? 99;
    const sb = STATUS_ORDER[b.status ?? ''] ?? 99;
    return sa - sb;
  });
}
