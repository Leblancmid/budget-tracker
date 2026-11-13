import { type ReactNode, useEffect, useId } from 'react'
import { X } from 'lucide-react'
import { useSavedOffline } from '@/lib/offline/offlineEvents'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | '6xl'
  /** Stay open when a change is saved offline (other modals close: the change is kept for later) */
  keepOpenWhenSavedOffline?: boolean
}

const sizes = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-lg', xl: 'sm:max-w-xl', '2xl': 'sm:max-w-2xl', '4xl': 'sm:max-w-4xl', '5xl': 'sm:max-w-5xl', '6xl': 'sm:max-w-6xl' }

/**
 * A dialog. On phones it's a bottom sheet: full width, clear of the status bar and the home
 * indicator, with its Cancel / Save row (class "modal-footer", see index.css) kept in view at the
 * bottom. On larger screens it's a centred window.
 */
export function Modal({ open, onClose, title, children, size = 'md', keepOpenWhenSavedOffline = false }: ModalProps) {
  const titleId = useId()
  // Saved on this device to send later: like a successful save, the form is done
  useSavedOffline(onClose, open && !keepOpenWhenSavedOffline)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    // The page scrolls inside <main>, not the body: hold that still while the dialog is open
    const main = document.querySelector('main')
    const before = main?.style.overflow ?? ''
    if (main) main.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      if (main) main.style.overflow = before
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/60"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={[
          'relative flex w-full flex-col bg-white shadow-xl',
          'rounded-t-2xl sm:rounded-xl',
          // Phones: up to just below the status bar, and clear of the home indicator
          'max-h-[calc(100dvh-env(safe-area-inset-top)-0.75rem)] pb-[env(safe-area-inset-bottom)] sm:max-h-[90dvh] sm:pb-0',
          'dark:bg-gray-900 dark:shadow-2xl dark:ring-1 dark:ring-gray-700',
          sizes[size],
        ].join(' ')}
      >
        {/* A grab bar, so it reads as a sheet on phones */}
        <span className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-300 sm:hidden dark:bg-gray-700" aria-hidden="true" />
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 py-2 pl-4 pr-2 sm:py-3 sm:pl-6 sm:pr-4 dark:border-gray-700/60">
          <h2 id={titleId} className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            title="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 pt-5 pb-5 scrollbar-thin has-[.modal-footer]:pb-0 sm:px-6">{children}</div>
      </div>
    </div>
  )
}
