import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

let addToast: ((message: string, type: ToastType) => void) | null = null

export const toast = {
  success: (message: string) => addToast?.(message, 'success'),
  error: (message: string) => addToast?.(message, 'error'),
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    addToast = (message, type) => {
      const id = Date.now()
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
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
          <span className={t.type === 'success' ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}>
            {t.message}
          </span>
          <button onClick={() => dismiss(t.id)} className="ml-auto text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
