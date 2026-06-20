import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['assets/**/*'],
      manifest: {
        name: 'Meroz In Italia · טוסקנה & רומא',
        short_name: 'Meroz Italy',
        description: 'מסלול הטיול שלנו באיטליה · 22/06 – 04/07',
        lang: 'he',
        dir: 'rtl',
        theme_color: '#9c3b2e',
        background_color: '#f3ecdf',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,webp,png,woff,woff2,svg}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            // trip data: always try network so a swapped trip.json shows up, but
            // fall back to cache when offline
            urlPattern: ({ url }) => url.pathname.endsWith('/trip.json'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'trip-data',
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // cache OpenStreetMap tiles as you view them (offline after first load)
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 1500, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ]
})
