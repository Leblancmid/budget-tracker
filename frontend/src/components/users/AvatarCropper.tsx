import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type WheelEvent } from 'react'
import { Minus, Move, Plus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

/** The crop area on screen, and the size of the picture that's uploaded. */
const VIEW = 280
const OUTPUT = 512
const MAX_ZOOM = 4

interface Size { w: number; h: number }

/** Keeps the picture covering the whole circle: it can't be dragged past its edges. */
function clamp(offset: { x: number; y: number }, img: Size, scale: number) {
  const maxX = Math.max(0, (img.w * scale - VIEW) / 2)
  const maxY = Math.max(0, (img.h * scale - VIEW) / 2)
  return { x: Math.min(maxX, Math.max(-maxX, offset.x)), y: Math.min(maxY, Math.max(-maxY, offset.y)) }
}

/**
 * Crop a new profile picture: drag to move it, zoom with the slider, the mouse wheel or + / −,
 * and the arrow keys nudge it. Saves a 512×512 WebP (a PNG on browsers that can't make WebP).
 * Mount with key={file} so a new file starts fresh.
 */
export function AvatarCropper({ file, saving, onCancel, onSave }: {
  file: File
  saving: boolean
  onCancel: () => void
  onSave: (blob: Blob) => void
}) {
  const url = useMemo(() => URL.createObjectURL(file), [file])
  useEffect(() => () => URL.revokeObjectURL(url), [url])

  const imgRef = useRef<HTMLImageElement>(null)
  const [natural, setNatural] = useState<Size | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; start: { x: number; y: number } } | null>(null)

  const baseScale = natural ? VIEW / Math.min(natural.w, natural.h) : 1
  const scale = baseScale * zoom

  const zoomTo = (next: number) => {
    const z = Math.min(MAX_ZOOM, Math.max(1, next))
    setZoom(z)
    if (natural) setOffset((o) => clamp(o, natural, baseScale * z))
  }
  const moveBy = (dx: number, dy: number) => {
    if (natural) setOffset((o) => clamp({ x: o.x + dx, y: o.y + dy }, natural, scale))
  }

  const onPointerDown = (e: PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, start: offset }
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!drag.current || !natural) return
    const d = drag.current
    setOffset(clamp({ x: d.start.x + e.clientX - d.x, y: d.start.y + e.clientY - d.y }, natural, scale))
  }
  const onWheel = (e: WheelEvent) => zoomTo(zoom - e.deltaY * 0.0015)
  const onKeyDown = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 20 : 5
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    if (moves[e.key]) { e.preventDefault(); moveBy(...moves[e.key]) }
    if (e.key === '+' || e.key === '=') zoomTo(zoom + 0.1)
    if (e.key === '-') zoomTo(zoom - 0.1)
  }

  const save = () => {
    const img = imgRef.current
    if (!img || !natural) return
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT
    canvas.height = OUTPUT
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const ratio = OUTPUT / VIEW
    const w = natural.w * scale
    const h = natural.h * scale
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, (VIEW / 2 + offset.x - w / 2) * ratio, (VIEW / 2 + offset.y - h / 2) * ratio, w * ratio, h * ratio)
    canvas.toBlob((blob) => { if (blob) onSave(blob) }, 'image/webp', 0.9)
  }

  return (
    <Modal open onClose={saving ? () => {} : onCancel} title="Profile picture" size="sm">
      <div className="flex flex-col items-center gap-5">
        <div
          role="application"
          aria-label="Picture crop area. Drag or use the arrow keys to move, plus and minus to zoom."
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => { drag.current = null }}
          onPointerCancel={() => { drag.current = null }}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
          className="relative cursor-grab touch-none overflow-hidden rounded-2xl bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:cursor-grabbing"
          style={{ width: VIEW, height: VIEW }}
        >
          <img
            ref={imgRef}
            src={url}
            alt=""
            draggable={false}
            onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
            style={natural ? {
              width: natural.w * scale,
              height: natural.h * scale,
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
            } : { opacity: 0 }}
          />
          {/* Dim everything outside the circle that becomes the picture */}
          <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(3,7,18,0.6)] ring-2 ring-white/80" />
          <span className="pointer-events-none absolute bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur">
            <Move className="h-3 w-3" /> Drag to move
          </span>
        </div>

        <div className="flex w-full items-center gap-3">
          <button type="button" onClick={() => zoomTo(zoom - 0.25)} aria-label="Zoom out" title="Zoom out" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => zoomTo(Number(e.target.value))}
            aria-label="Zoom"
            className="flex-1 accent-indigo-600"
          />
          <button type="button" onClick={() => zoomTo(zoom + 0.25)} aria-label="Zoom in" title="Zoom in" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="modal-footer flex w-full justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button variant="secondary" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button onClick={save} loading={saving} disabled={!natural}>Save picture</Button>
        </div>
      </div>
    </Modal>
  )
}
