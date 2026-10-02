import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GITHUB_PAGES=true (set by scripts/deploy-pages.mjs) builds for the repo sub-path.
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/motto-archery-3d/' : '/',
})
