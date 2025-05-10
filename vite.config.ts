
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8080,
    host: "::",
    hmr: {
      // Enable HMR for all environments
      clientPort: 443,
    },
    // Allow all hosts
    strictPort: true,
    // Add the Lovable domain to allowed hosts
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '37ffde61-40d6-47ea-9f1e-41a9df4ec03b.lovableproject.com',
      '.lovableproject.com'
    ],
  },
}));
