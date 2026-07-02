import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error'

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastItem {
  id: number
  message: string
  type: ToastType
  action?: ToastAction
}

interface ToastOptions {
  action?: ToastAction
}

let addToast: ((message: string, type: ToastType, opts?: ToastOptions) => void) | null = null

export const toast = {
  success: (message: string, opts?: ToastOptions) => addToast?.(message, 'success', opts),
  error: (message: string, opts?: ToastOptions) => addToast?.(message, 'error', opts),
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    addToast = (message, type, opts) => {
      const id = Date.now()
      setToasts((prev) => [...prev, { id, message, type, action: opts?.action }])
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
    }
    return () => { addToast = null }
  }, [])

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            'flex items-start gap-3 rounded-xl p-4 shadow-lg text-sm',
            'animate-in slide-in-from-right-5 duration-200',
            t.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800'
              : 'bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-800',
          ].join(' ')}
        >
          {t.type === 'success'
            ? <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            : <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />}
          <span className={[
            'flex-1',
            t.type === 'success' ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300',
          ].join(' ')}>
            {t.message}
          </span>
          {t.action && (
            <button
              onClick={() => { t.action!.onClick(); dismiss(t.id) }}
              className="shrink-0 rounded px-2 py-0.5 text-xs font-semibold underline underline-offset-2 text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200 transition-colors"
            >
              {t.action.label}
            </button>
          )}
          <button onClick={() => dismiss(t.id)} className="shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
