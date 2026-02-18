import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
  },
  ssr: {
    // Treat these as external in SSR build to avoid Node.js bundle issues
    noExternal: [],
  },
})
