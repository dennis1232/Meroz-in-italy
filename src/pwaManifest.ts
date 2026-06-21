import type { TripMeta } from './types'

export const PWA_TRIP_KEY = 'meroz-pwa-trip'
export const PWA_HOME_TITLE = 'Meroz Italy'
export const PWA_ICON = '/icons/icon-192.png'
export const PWA_ICON_LARGE = '/icons/icon-512.png'

export function tripDisplayName(title: string, subtitle: string, fallback = ''): string {
  const t = (title || fallback).trim()
  const sub = subtitle.trim()
  return sub ? `${t} · ${sub}` : t
}

export function tripManifestUrl(tripId: string): string {
  return `/trip/${encodeURIComponent(tripId)}/manifest.webmanifest`
}

export function rememberPwaTrip(tripId: string) {
  if (!tripId) return
  try { localStorage.setItem(PWA_TRIP_KEY, tripId) } catch { /* private mode */ }
}

export function setAppleTouchIcon() {
  let link = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'apple-touch-icon'
    document.head.appendChild(link)
  }
  link.href = PWA_ICON
}

/** Set manifest link + remember trip for standalone launch fallback. */
export function setTripManifestLink(tripId: string) {
  if (!tripId) return
  rememberPwaTrip(tripId)
  setAppleTouchIcon()

  document.querySelectorAll('link[rel="manifest"]').forEach(el => el.remove())

  const link = document.createElement('link')
  link.rel = 'manifest'
  link.href = tripManifestUrl(tripId)
  document.head.appendChild(link)
}

export function applyTripPwa(tripId: string, tripMeta: Pick<TripMeta, 'title' | 'subtitle' | 'lang'>) {
  if (!tripId) return
  setTripManifestLink(tripId)

  const title = tripMeta.title.trim() || tripId
  const name = tripDisplayName(title, tripMeta.subtitle, tripId)

  document.title = name
  document.documentElement.lang = tripMeta.lang === 'en' ? 'en' : 'he'
  document.documentElement.dir = tripMeta.lang === 'en' ? 'ltr' : 'rtl'
}

/** Standalone PWA opened at / — redirect to the trip this user installed. */
export function redirectStandaloneToSavedTrip(): boolean {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  if (!standalone) return false

  const path = location.pathname.replace(/\/$/, '') || '/'
  if (path !== '/') return false

  try {
    const saved = localStorage.getItem(PWA_TRIP_KEY)
    if (saved && /^[a-z0-9-]+$/.test(saved)) {
      location.replace(`/trip/${saved}`)
      return true
    }
  } catch { /* ignore */ }
  return false
}

export function buildTripManifestJson(
  tripId: string,
  origin: string,
  title: string,
  subtitle: string,
  lang: string
) {
  const startUrl = `${origin}/trip/${tripId}`

  return {
    id: startUrl,
    name: PWA_HOME_TITLE,
    short_name: PWA_HOME_TITLE,
    description: subtitle.trim() || title.trim() || tripId,
    start_url: startUrl,
    scope: `${origin}/`,
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#9c3b2e',
    background_color: '#f3ecdf',
    lang,
    dir: lang === 'en' ? 'ltr' : 'rtl',
    icons: [
      { src: `${origin}${PWA_ICON}`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${origin}${PWA_ICON_LARGE}`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${origin}${PWA_ICON_LARGE}`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
