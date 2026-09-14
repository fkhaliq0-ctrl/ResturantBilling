import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [tailwindcss(), react()],
  server: {
    port: 5180,
    strictPort: true,
    watch: {
      usePolling: true
    }
  }
})




