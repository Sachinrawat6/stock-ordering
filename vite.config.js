import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Dev proxy to avoid CORS issues with internal APIs
    proxy: {
      '/proxy/nocodb': {
        target: 'https://nocodb.qurvii.com',
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/proxy\/nocodb/, ''),
      },
      '/proxy/raw-material': {
        target: 'https://raw-material-backend.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/proxy\/raw-material/, ''),
      },
    },
  },
})
