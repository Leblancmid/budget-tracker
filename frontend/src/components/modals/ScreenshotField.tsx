import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type DragEvent } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { sameOriginPath, SCREENSHOT_TYPES } from '@/utils/listing'

/**
 * Screenshot picker: click to choose, drag a file in, or focus it and press Ctrl+V
 * to paste a screenshot straight from the clipboard.
 */
export function ScreenshotField({ currentUrl, file, removed, error, onFile, onRemove }: {
  /** Saved screenshot (shown until replaced or removed) */
  currentUrl: string | null
  file: File | null
  removed: boolean
  error?: string
  onFile: (file: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const shown = preview ?? (!removed && currentUrl ? sameOriginPath(currentUrl) : null)

  const takeFirstImage = (files: FileList | null | undefined) => {
    const img = Array.from(files ?? []).find((f) => f.type.startsWith('image/'))
    if (img) onFile(img)
  }

  const onPaste = (e: ClipboardEvent) => {
    const img = Array.from(e.clipboardData.files).find((f) => f.type.startsWith('image/'))
    if (img) { e.preventDefault(); onFile(img) }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    takeFirstImage(e.dataTransfer.files)
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Stats screenshot</p>
      <div
        role="button"
        tabIndex={0}
        aria-label="Choose or paste a stats screenshot"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click() } }}
        onPaste={onPaste}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={[
          'relative flex min-h-28 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500',
          error ? 'border-red-400 dark:border-red-500'
            : dragging ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600',
        ].join(' ')}
      >
        {shown ? (
          <img src={shown} alt="Stats screenshot" className="max-h-48 w-full object-contain bg-black" />
        ) : (
          <div className="flex flex-col items-center gap-1 px-4 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
            <ImagePlus size={20} className="text-gray-400" />
            <span className="pointer-coarse:hidden">Click, drop, or <span className="font-semibold">Ctrl+V</span> to paste the Stats screen</span>
            <span className="hidden pointer-coarse:inline">Tap to choose the Stats screenshot</span>
          </div>
        )}
        {shown && (
          <button
            type="button"
            title="Remove screenshot"
            aria-label="Remove screenshot"
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={SCREENSHOT_TYPES.join(',')}
        className="hidden"
        onChange={(e) => { takeFirstImage(e.target.files); e.target.value = '' }}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
