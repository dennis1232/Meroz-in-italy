import type { Stop, StopTag } from './data'

// ── Raw (editor) types — lat/lng kept as strings while typing ─────────────────
export type StopRaw = Omit<Stop, 'lat' | 'lng'> & { lat?: string; lng?: string }
export type SpotRaw = { name: string; he: string; desc: string; img: string; lat: string; lng: string }

export type DayRaw = {
  n: number
  date: string
  dow: string
  en: string
  iso?: string
  hero: string
  title: string
  intro: string
  stops: StopRaw[]
}

export type TripRaw = {
  meta: {
    title: string
    subtitle: string
    country: string
    startISO: string
    endISO: string
    who: string
    cover: string
  }
  contact: {
    instagram: string
    phoneIL: string
    phoneILraw: string
    phoneIT: string
    phoneITraw: string
  }
  days: DayRaw[]
  attractions: SpotRaw[]
  places: SpotRaw[]
}

export const TAGS: StopTag[] = ['food', 'cafe', 'site', 'wine', 'gelato', 'hotel', 'shop']
export const TAG_LABEL: Record<string, string> = {
  food: '🍽️ food', cafe: '☕ cafe', site: '🏛️ site',
  wine: '🍷 wine', gelato: '🍦 gelato', hotel: '🏨 hotel', shop: '🛍️ shop'
}

export const HEBREW_DOW = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת']

// Pick one date → derive dd/mm, Hebrew day-of-week, English label.
export function isoToFields(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return {
    date: `${dd}/${mm}`,
    dow: HEBREW_DOW[d.getDay()],
    en: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  }
}

// Extract lat/lng from a pasted Google Maps / Waze link (or raw "lat, lng").
export function parseLatLng(text: string): { lat: string; lng: string } | null {
  if (!text) return null
  const t = text.trim()
  const tries: RegExp[] = [
    /^(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/,          // raw "lat, lng"
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,                      // google place
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,                          // google /@lat,lng
    /[?&](?:ll|query|q|center)=(-?\d+\.\d+),(-?\d+\.\d+)/i,// ll=/query=/q=
    /ll[.=](-?\d+\.\d+)(?:,|%2C)(-?\d+\.\d+)/i,            // waze to=ll.lat,lng
    /(-?\d{1,3}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})/           // generic fallback
  ]
  for (const re of tries) {
    const m = t.match(re)
    if (m) return { lat: m[1], lng: m[2] }
  }
  return null
}

export function toRaw(data: any): TripRaw {
  const spot = (s: any): SpotRaw => ({
    name: s.name || '', he: s.he || '', desc: s.desc || '', img: s.img || '',
    lat: s.lat != null ? String(s.lat) : '', lng: s.lng != null ? String(s.lng) : ''
  })
  return {
    meta: { ...data.meta },
    contact: { ...data.contact },
    days: (data.days || []).map((day: any) => ({
      ...day,
      stops: (day.stops || []).map((s: any) => ({
        ...s,
        lat: s.lat != null ? String(s.lat) : '',
        lng: s.lng != null ? String(s.lng) : ''
      }))
    })),
    attractions: (data.attractions || []).map(spot),
    places: (data.places || []).map(spot)
  }
}

export function toClean(raw: TripRaw) {
  const num = (v: string) => {
    const n = parseFloat(v)
    return isNaN(n) ? undefined : n
  }
  const cleanSpot = (s: SpotRaw) => {
    const o: Record<string, unknown> = { name: s.name, he: s.he, desc: s.desc, img: s.img }
    const lat = num(s.lat), lng = num(s.lng)
    if (lat != null) o.lat = lat
    if (lng != null) o.lng = lng
    return o
  }
  return {
    meta: raw.meta,
    contact: raw.contact,
    days: raw.days.map((day) => ({
      n: day.n, date: day.date, dow: day.dow, en: day.en, iso: day.iso,
      hero: day.hero, title: day.title, intro: day.intro,
      stops: day.stops.map((s) => {
        const stop: Record<string, unknown> = { name: s.name }
        if (s.time) stop.time = s.time
        if (s.desc) stop.desc = s.desc
        if (s.move) stop.move = true
        if (s.via) stop.via = s.via
        if (s.tag) stop.tag = s.tag
        if (s.parking) stop.parking = true
        const lat = num(s.lat || ''), lng = num(s.lng || '')
        if (lat != null) stop.lat = lat
        if (lng != null) stop.lng = lng
        return stop
      })
    })),
    attractions: raw.attractions.map(cleanSpot),
    places: raw.places.map(cleanSpot)
  }
}
