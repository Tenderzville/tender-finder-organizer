
import { defineConfig } from 'vite'
import dns from 'dns'

// This is needed for Replit to resolve localhost correctly
dns.setDefaultResultOrder('verbatim')
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    hmr: {
      clientPort: 443,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'a5c4f945-5389-402b-8a46-baa58a1ed552-00-1amg5adxhq8tu.worf.replit.dev',
      // Keep any existing hosts
      'localhost',
      '.replit.dev'
    ]
  }
})
