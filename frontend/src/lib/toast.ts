export type ToastType = 'success' | 'error'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  action?: ToastAction
}

type ToastHandler = (message: string, type: ToastType, opts?: ToastOptions) => void

let handler: ToastHandler | null = null

/** Called by <ToastContainer /> while it's mounted. */
export function setToastHandler(next: ToastHandler | null): void {
  handler = next
}

/** Show a toast from anywhere (no-op until <ToastContainer /> is mounted). */
export const toast = {
  success: (message: string, opts?: ToastOptions) => handler?.(message, 'success', opts),
  error:   (message: string, opts?: ToastOptions) => handler?.(message, 'error', opts),
}
