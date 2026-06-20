import type { Stop } from './data'

export const BASE = import.meta.env.BASE_URL
export const logo = `${BASE}assets/logo.png`

export type Tab = 'home' | 'trip' | 'map' | 'see' | 'more' | 'admin'

export const dayColors = ['#9c3b2e', '#c9772e', '#2f4a36', '#7d2f24', '#b5651d', '#4a6741', '#a0522d']
export const colorFor = (n: number) => dayColors[n % dayColors.length]

export const TAG_EMOJI: Record<string, string> = {
  food: '🍽️', cafe: '☕', site: '🏛️', wine: '🍷', gelato: '🍦', hotel: '🏨', shop: '🛍️'
}

// Google Maps by name (gives photos/reviews) — not lat/lng, so the user keeps context.
export const gmaps = (s: { name: string; lat?: number; lng?: number }) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name + ' Italy')}`

export const waze = (s: { lat: number; lng: number }) => `waze://?ll=${s.lat},${s.lng}&navigate=yes`

export const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)
export const isStandalone =
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true)

export function copyTripLink(tripId: string): Promise<void> {
  return navigator.clipboard.writeText(`${location.origin}/trip/${tripId}`)
}

// Per-stop navigation decision for the itinerary list:
// - car drive → Waze (to its own pin, or the next pinned stop)
// - train/flight legs → no Waze, just an icon
// - if a parking stop follows before the next leg, suppress the drive's Waze (parking has its own)
export function navForStop(stops: Stop[], i: number): {
  isDrive: boolean
  icon: string | null
  wazeTarget: Stop | undefined
} {
  const s = stops[i]
  const isDrive = !!s.move && !s.via
  const icon = s.via === 'train' ? '🚆' : s.via === 'flight' ? '✈️' : s.move ? '🚗' : null
  const stopsAfter = stops.slice(i + 1)
  const nextMoveIdx = stopsAfter.findIndex((x) => x.move)
  const untilNextMove = nextMoveIdx === -1 ? stopsAfter : stopsAfter.slice(0, nextMoveIdx)
  const hasNearbyParking = untilNextMove.some((x) => x.parking)
  const wazeTarget = isDrive && !hasNearbyParking
    ? (s.lat != null ? s : stopsAfter.find((x) => x.lat != null))
    : undefined
  return { isDrive, icon, wazeTarget }
}
