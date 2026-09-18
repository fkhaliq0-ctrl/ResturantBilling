import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  css: {
    transformer: 'postcss',
  },
  define: {
    'process.env': {}
  },
  server: {
    port: 5180,
    host: true,
  },
  preview: {
    port: 5180,
  },
})
