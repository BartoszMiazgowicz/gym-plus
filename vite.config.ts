import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // We hand-maintain public/manifest.json (linked directly in index.html),
      // so let the plugin only handle the service worker, not manifest generation.
      manifest: false,
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'profil.jpg'],
      workbox: {
        // Precache the built app shell so the app still loads offline;
        // all real data lives in localStorage/Supabase, handled by the app itself.
        globPatterns: ['**/*.{js,css,html,png,jpg,svg,ico}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
