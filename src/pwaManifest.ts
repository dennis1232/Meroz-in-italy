import type { TripMeta } from './data'

export const PWA_TRIP_KEY = 'meroz-pwa-trip'

export function tripManifestUrl(tripId: string): string {
  return `/trip/${encodeURIComponent(tripId)}/manifest.webmanifest`
}

export function rememberPwaTrip(tripId: string) {
  if (!tripId) return
  try { localStorage.setItem(PWA_TRIP_KEY, tripId) } catch { /* private mode */ }
}

/** Set manifest link + remember trip for standalone launch fallback. */
export function setTripManifestLink(tripId: string) {
  if (!tripId) return
  rememberPwaTrip(tripId)

  document.querySelectorAll('link[rel="manifest"]').forEach(el => el.remove())

  const link = document.createElement('link')
  link.rel = 'manifest'
  link.href = tripManifestUrl(tripId)
  document.head.appendChild(link)
}

export function applyTripPwa(tripId: string, tripMeta: Pick<TripMeta, 'title' | 'subtitle' | 'lang'>) {
  if (!tripId) return
  setTripManifestLink(tripId)

  const title = tripMeta.title?.trim() || tripId
  const shortName = title.length > 14 ? `${title.slice(0, 12)}…` : title
  const name = tripMeta.subtitle?.trim() ? `${title} · ${tripMeta.subtitle.trim()}` : title

  document.title = name
  document.documentElement.lang = tripMeta.lang === 'en' ? 'en' : 'he'
  document.documentElement.dir = tripMeta.lang === 'en' ? 'ltr' : 'rtl'

  document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', shortName)
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
