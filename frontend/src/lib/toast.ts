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

let errorsMutedUntil = 0

/**
 * Don't show error toasts for a moment. Used when a change is saved offline: the page's own
 * "couldn't save" message would be wrong, the "saved on this device" one has already been shown.
 */
export function muteErrorToasts(ms: number): void {
  errorsMutedUntil = Date.now() + ms
}

/** Show a toast from anywhere (no-op until <ToastContainer /> is mounted). */
export const toast = {
  success: (message: string, opts?: ToastOptions) => handler?.(message, 'success', opts),
  error:   (message: string, opts?: ToastOptions) => {
    if (Date.now() < errorsMutedUntil || !message) return
    handler?.(message, 'error', opts)
  },
}
