import { useEffect, useState } from 'react'

interface Loaded {
  key: string
  images: Map<string, HTMLImageElement>
  failed: string[]
}

const EMPTY: Loaded = { key: '', images: new Map(), failed: [] }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = () => reject(new Error(src))
    img.src = src
  })
}

/**
 * Loads every URL as an <img> (for drawing on a canvas). `loading` is derived from
 * whether the loaded set matches the requested one, so nothing is reset in an effect.
 */
export function useLoadedImages(urls: string[]) {
  const key = urls.join('\n')
  const [loaded, setLoaded] = useState<Loaded>(EMPTY)

  useEffect(() => {
    let cancelled = false
    const list = key ? key.split('\n') : []
    Promise.allSettled(list.map(loadImage)).then((results) => {
      if (cancelled) return
      const images = new Map<string, HTMLImageElement>()
      const failed: string[] = []
      results.forEach((r, i) => (r.status === 'fulfilled' ? images.set(list[i], r.value) : failed.push(list[i])))
      setLoaded({ key, images, failed })
    })
    return () => { cancelled = true }
  }, [key])

  const ready = loaded.key === key
  return { images: ready ? loaded.images : EMPTY.images, failed: ready ? loaded.failed : [], loading: !ready }
}
