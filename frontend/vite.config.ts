import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import path from 'path'

/** Files from public/ the installed app needs offline (the build's own files are added automatically). */
const OFFLINE_PUBLIC_FILES = ['manifest.webmanifest', 'logo.svg', 'favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png']

/**
 * Writes sw.js (from sw/sw.js) with every file of this build, so the installed app opens without a
 * connection. The version is a hash of the file names (which change with their content), so each
 * deploy that changes anything replaces the saved copy.
 */
function serviceWorker(): Plugin {
  return {
    name: 'service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = [
        ...Object.keys(bundle).filter((f) => f !== 'index.html' && !f.endsWith('.map')),
        ...OFFLINE_PUBLIC_FILES,
      ].sort()
      const version = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 12)
      const source = readFileSync(path.resolve(__dirname, 'sw/sw.js'), 'utf8')
        .replace("'__VERSION__'", JSON.stringify(version))
        .replace('__FILES__', JSON.stringify(files))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: env.VITE_BASE_URL || '/',
    plugins: [
      react(),
      tailwindcss(),
      serviceWorker(),
    ],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
        // Uploaded screenshots: same origin in dev so the listing-image canvas can export them
        '/storage': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
  }
})
