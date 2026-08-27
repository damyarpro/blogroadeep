import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

// GitHub Pages serves everything from a project subpath (e.g. /blogroadeep/) and has
// no server-side rewrite for client-side routes, so we need two things at build time:
// - `base` driven by an env var, so asset/link URLs resolve under that subpath.
// - a copy of index.html as 404.html, so a deep-link like /blogroadeep/articles that
//   Pages can't find on disk still serves the SPA shell and lets react-router take over.
function spaFallback404(): Plugin {
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    closeBundle() {
      const outDir = resolve(rootDir, 'dist')
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss(), spaFallback404()],
})
