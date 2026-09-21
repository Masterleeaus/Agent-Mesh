export function isStatus<T extends { status?: string }>(item: T, ...statuses: string[]): boolean {
  return statuses.includes(item.status ?? '');
}

export function filterByStatus<T extends { status?: string }>(items: T[], ...statuses: string[]): T[] {
  return items.filter((item) => isStatus(item, ...statuses));
}

export function filterBySearch<T extends Record<string, unknown>>(
  items: T[],
  query: string,
  fields: (keyof T)[]
): T[] {
  if (!query.trim()) return items;
  const lower = query.toLowerCase();
  return items.filter((item) =>
    fields.some((field) => {
      const val = item[field];
      return typeof val === 'string' && val.toLowerCase().includes(lower);
    })
  );
}
