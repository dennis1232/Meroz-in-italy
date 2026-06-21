import type { TripMeta } from './data'

let lastBlobUrl: string | null = null

/** Per-trip manifest so home-screen install opens /trip/{id}, not /. */
export function applyTripPwa(tripId: string, tripMeta: Pick<TripMeta, 'title' | 'subtitle' | 'lang'>) {
  if (!tripId) return

  const startUrl = `/trip/${tripId}`
  const base = import.meta.env.BASE_URL
  const title = tripMeta.title?.trim() || tripId
  const shortName = title.length > 14 ? `${title.slice(0, 12)}…` : title
  const name = tripMeta.subtitle?.trim() ? `${title} · ${tripMeta.subtitle.trim()}` : title

  document.title = name
  document.documentElement.lang = tripMeta.lang === 'en' ? 'en' : 'he'
  document.documentElement.dir = tripMeta.lang === 'en' ? 'ltr' : 'rtl'

  const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]')
  appleTitle?.setAttribute('content', shortName)

  const manifest = {
    id: startUrl,
    name,
    short_name: shortName,
    description: tripMeta.subtitle?.trim() || title,
    start_url: startUrl,
    scope: startUrl,
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#9c3b2e',
    background_color: '#f3ecdf',
    lang: tripMeta.lang === 'en' ? 'en' : 'he',
    dir: tripMeta.lang === 'en' ? 'ltr' : 'rtl',
    icons: [
      { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
      { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  }

  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'manifest'
    document.head.appendChild(link)
  }

  if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl)
  lastBlobUrl = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/json' }))
  link.href = lastBlobUrl
}
