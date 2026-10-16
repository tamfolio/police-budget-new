/**
 * Normalises all API list response shapes into a plain array.
 * Handles: direct array, { items }, { data: [] }, { data: { items: [] } },
 * { success, data: [] }, { success, data: { items: [] } }
 */
export function normalizeList<T>(d: unknown): T[] {
  if (Array.isArray(d)) return d as T[]
  const obj = d as Record<string, unknown>
  if (obj?.data !== undefined) {
    if (Array.isArray(obj.data)) return obj.data as T[]
    const inner = obj.data as Record<string, unknown>
    if (Array.isArray(inner?.items)) return inner.items as T[]
    if (Array.isArray(inner?.data)) return inner.data as T[]
  }
  if (Array.isArray(obj?.items)) return obj.items as T[]
  return []
}

/** Same but also returns a total count alongside the items. */
export function normalizePagedList<T>(d: unknown): { items: T[]; total: number } {
  if (Array.isArray(d)) return { items: d as T[], total: d.length }
  const obj = d as Record<string, unknown>
  if (obj?.data !== undefined) {
    if (Array.isArray(obj.data)) return { items: obj.data as T[], total: (obj.total as number) ?? obj.data.length }
    const inner = obj.data as Record<string, unknown>
    if (Array.isArray(inner?.items)) return { items: inner.items as T[], total: (inner.total as number) ?? inner.items.length }
    if (Array.isArray(inner?.data)) return { items: inner.data as T[], total: (inner.total as number) ?? inner.data.length }
  }
  if (Array.isArray(obj?.items)) return { items: obj.items as T[], total: (obj.total as number) ?? obj.items.length }
  return { items: [], total: 0 }
}
