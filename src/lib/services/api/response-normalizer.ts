export function normalizeListResponse<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (!data || typeof data !== 'object') {
    return [];
  }

  const record = data as Record<string, unknown>;

  if (Array.isArray(record.items)) {
    return record.items as T[];
  }

  if (Array.isArray(record.data)) {
    return record.data as T[];
  }

  if (Array.isArray(record.results)) {
    return record.results as T[];
  }

  return [];
}
