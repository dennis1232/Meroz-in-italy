import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function tripManifestDev(): Plugin {
  return {
    name: 'trip-manifest-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/trip\/([^/]+)\/manifest\.webmanifest/)
        if (!match) return next()

        const tripId = decodeURIComponent(match[1])
        let title = tripId
        let subtitle = ''
        let lang = 'he'

        try {
          const port = server.config.server.port ?? 5173
          const tripRes = await fetch(`http://127.0.0.1:${port}/trips/${tripId}.json`)
          if (tripRes.ok) {
            const data = await tripRes.json()
            title = data.meta?.title?.trim() || tripId
            subtitle = data.meta?.subtitle?.trim() || ''
            lang = data.meta?.lang === 'en' ? 'en' : 'he'
          }
        } catch { /* defaults */ }

        const origin = `http://127.0.0.1:${server.config.server.port ?? 5173}`
        const startUrl = `${origin}/trip/${tripId}`
        const shortName = title.length > 14 ? `${title.slice(0, 12)}…` : title
        const name = subtitle ? `${title} · ${subtitle}` : title

        res.setHeader('Content-Type', 'application/manifest+json')
        res.end(JSON.stringify({
          id: startUrl,
          name,
          short_name: shortName,
          description: subtitle || title,
          start_url: startUrl,
          scope: `${origin}/`,
          display: 'standalone',
          orientation: 'portrait',
          theme_color: '#9c3b2e',
          background_color: '#f3ecdf',
          lang,
          dir: lang === 'en' ? 'ltr' : 'rtl',
          icons: [
            { src: `${origin}/icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
            { src: `${origin}/icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
            { src: `${origin}/icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        }))
      })
    },
  }
}

export default defineConfig({
  base: '/',
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/.netlify/functions': {
        target: 'http://127.0.0.1:9999',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    tripManifestDev(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['assets/**/*', 'icons/**/*'],
      manifest: false,
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,webp,png,woff,woff2,svg}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            // trip data: always try network so a swapped trip.json shows up, but
            // fall back to cache when offline
            urlPattern: ({ url }) => {
              if (url.pathname.endsWith('/trips/index.json')) return false
              return url.pathname.endsWith('/trip.json') || /\/trips\/[^/]+\.json$/.test(url.pathname)
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'trip-data',
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // cache map tiles (CARTO + OSM) as you view them (offline after first load)
            urlPattern: /^https:\/\/([a-d]\.basemaps\.cartocdn\.com|[abc]\.tile\.openstreetmap\.org)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 1500, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ]
})
