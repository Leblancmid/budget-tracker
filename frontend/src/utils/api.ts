/** The shape every rejected API call has (see the axios response interceptor). */
export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

/** The message of a rejected API call (or any thrown error), with a fallback. */
export function errorMessage(e: unknown, fallback = 'Something went wrong.'): string {
  return (e as Partial<ApiError> | null)?.message ?? fallback
}

/** Laravel validation errors as `{ field: firstMessage }`, or null when there are none. */
export function flattenApiErrors(e: unknown): Record<string, string> | null {
  const err = e as Partial<ApiError> | null
  if (!err?.errors) return null
  return Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]]))
}
