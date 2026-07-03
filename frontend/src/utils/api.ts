export function flattenApiErrors(e: unknown): Record<string, string> | null {
  const err = e as { errors?: Record<string, string[]> }
  if (!err?.errors) return null
  return Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]]))
}
