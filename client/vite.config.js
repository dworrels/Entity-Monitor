import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()], 
  server: {
    host: true, // allows access from other devices on your network
    proxy: {
      '/api': 'http://localhost:8080', // proxies API calls to Flask
    },
  },
})

