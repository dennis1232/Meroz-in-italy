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

export type Spot = { name: string; desc: string; img: string; lat: number; lng: number; mapLink?: string }

export type TripMeta = {
  title: string
  subtitle: string
  startISO: string   // yyyy-mm-dd, first day
  endISO: string     // yyyy-mm-dd, last day
  who: string        // travellers line shown on the cover
  cover: string      // cover image (filename | data: | http url)
  lang: 'he' | 'en' // UI language — chosen by admin, not traveler
}

export type Contact = {
  instagram: string
  phoneIL: string
  phoneILraw: string
  phoneIT: string
  phoneITraw: string
}

// "2026-06-22" → "22/06"
export const ddmm = (iso: string): string => {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

// Resolve an image reference: data: URLs and http(s)/absolute URLs pass through
// untouched; bare filenames are looked up under /assets/.
export const A = (f: string): string => {
  if (!f) return f
  if (/^(data:|https?:|\/)/.test(f)) return f
  return `${import.meta.env.BASE_URL}assets/${f}`
}
