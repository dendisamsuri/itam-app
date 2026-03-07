import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@mui/material',
      '@mui/icons-material',
      'html5-qrcode',
      'axios',
      'react-router-dom',
      '@emotion/react',
      '@emotion/styled',
      '@supabase/supabase-js'
    ]
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173,
    },
    watch: {
      usePolling: false,
    }
  }
})
