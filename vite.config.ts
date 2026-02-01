/// <reference types="vitest/config" />

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'favicon-32x32.png',
        'favicon-16x16.png',
        'favicon-16x16.png',
        'android-chrome-192x192.png',
        'android-chrome-512x512.png',
        'site.webmanifest'
      ],
      manifest: {
        name: 'Omen - Tracker',
        short_name: 'Omen',
        description: 'Lifetime simple habit tracker',
        theme_color: '#0b0809',
        display: 'standalone', // Removes Safari UI
        icons: [
          { src: 'android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    environment: 'happy-dom',
    globals: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('motion')) {
              return 'motion-vendor';
            }
            return 'vendor';
          }
        }
      }
    }
  },
})
