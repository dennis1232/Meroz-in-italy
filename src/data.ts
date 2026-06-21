export type StopTag = 'food' | 'cafe' | 'site' | 'wine' | 'gelato' | 'hotel' | 'shop'

export type Stop = {
  name: string
  time?: string
  desc?: string
  move?: boolean
  via?: 'train' | 'flight'
  tag?: StopTag
  parking?: boolean
  lat?: number
  lng?: number
  mapLink?: string
}

export type Day = {
  n: number
  date: string
  dow: string
  en: string
  hero: string
  title: string
  intro: string
  iso?: string
  stops: Stop[]
}

export type Spot = { name: string; he: string; desc: string; img: string; lat: number; lng: number; mapLink?: string }

export type TripMeta = {
  title: string
  subtitle: string
  country: string
  startISO: string   // yyyy-mm-dd, first day
  endISO: string     // yyyy-mm-dd, last day
  who: string        // travellers line shown on the cover
  cover: string      // cover image (filename | data: | http url)
  lang: 'he' | 'en' // UI language — chosen by admin, not traveler
}

// "2026-06-22" → "22/06"
export const ddmm = (iso: string): string => {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export type Contact = {
  instagram: string
  phoneIL: string
  phoneILraw: string
  phoneIT: string
  phoneITraw: string
}

// Resolve an image reference: data: URLs and http(s)/absolute URLs pass through
// untouched; bare filenames are looked up under /assets/.
export const A = (f: string): string => {
  if (!f) return f
  if (/^(data:|https?:|\/)/.test(f)) return f
  return `${import.meta.env.BASE_URL}assets/${f}`
}

// ── Live bindings — populated by initTrip() before the app renders ─────────────
export let currentTripId: string = ''
export let meta: TripMeta = {
  title: '', subtitle: '', country: '', startISO: '', endISO: '', who: '', cover: '', lang: 'he'
}
export let days: Day[] = []
export let attractions: Spot[] = []
export let places: Spot[] = []
export let contact: Contact = {
  instagram: '', phoneIL: '', phoneILraw: '', phoneIT: '', phoneITraw: ''
}
export let rawTrip: any = null

export function initTrip(raw: any) {
  rawTrip = raw
  meta = raw.meta
  contact = raw.contact
  days = (raw.days || []).map((d: any) => ({ ...d, hero: A(d.hero), stops: d.stops as Stop[] }))
  attractions = (raw.attractions || []).map((s: any) => ({ ...s, img: A(s.img) }))
  places = (raw.places || []).map((s: any) => ({ ...s, img: A(s.img) }))
}

export function setCurrentTripId(id: string) { currentTripId = id }

export async function loadTrip(tripId: string): Promise<void> {
  currentTripId = tripId
  const res = await fetch(`${import.meta.env.BASE_URL}trips/${tripId}.json`, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`trips/${tripId}.json ${res.status}`)
  initTrip(await res.json())
}
