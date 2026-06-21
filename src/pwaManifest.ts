import type { TripMeta } from './data'

export function tripManifestUrl(tripId: string): string {
  return `/trip/${encodeURIComponent(tripId)}/manifest.webmanifest`
}

/** Set manifest link immediately — must run before install prompt (sync in index.html or main). */
export function setTripManifestLink(tripId: string) {
  if (!tripId) return
  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'manifest'
    document.head.appendChild(link)
  }
  link.href = tripManifestUrl(tripId)
}

/** Update page title + iOS home-screen label after trip data loads. */
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
