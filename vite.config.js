import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
plugins: [react(), tailwindcss()],
base: '/',
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
