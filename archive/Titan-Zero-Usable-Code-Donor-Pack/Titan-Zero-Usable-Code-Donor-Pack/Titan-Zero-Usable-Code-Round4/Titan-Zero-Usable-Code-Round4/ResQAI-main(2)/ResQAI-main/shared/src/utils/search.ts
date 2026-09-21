export interface SearchOptions {
  fields?: string[];
  caseSensitive?: boolean;
  exact?: boolean;
  threshold?: number;
}

export function search<T extends Record<string, unknown>>(items: T[], query: string, options: SearchOptions = {}): T[] {
  if (!query || !query.trim()) return items;
  const q = options.caseSensitive ? query.trim() : query.trim().toLowerCase();
  return items.filter(item => {
    const fields = options.fields || Object.keys(item);
    return fields.some(field => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      const str = String(value);
      const normalized = options.caseSensitive ? str : str.toLowerCase();
      if (options.exact) return normalized === q;
      if (options.threshold) {
        let matches = 0;
        const words = q.split(/\s+/);
        for (const word of words) {
          if (normalized.includes(word)) matches++;
        }
        return matches / words.length >= options.threshold;
      }
      return normalized.includes(q);
    });
  });
}

export function filterBySearch<T extends Record<string, unknown>>(items: T[], query: string, fields: string[]): T[] {
  return search(items, query, { fields });
}
