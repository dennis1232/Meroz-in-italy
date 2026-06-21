import { type Stop, type Day, type Spot, type TripMeta, type Contact, A } from './types'

// ── Live bindings — populated by initTrip() before the app renders ─────────────
export let currentTripId: string = ''
export let meta: TripMeta = {
  title: '', subtitle: '', startISO: '', endISO: '', who: '', cover: '', lang: 'he'
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
  meta = { title: '', subtitle: '', startISO: '', endISO: '', who: '', cover: '', lang: 'he', ...(raw.meta ?? {}) }
  contact = { instagram: '', phoneIL: '', phoneILraw: '', phoneIT: '', phoneITraw: '', ...(raw.contact ?? {}) }
  days = (raw.days || []).map((d: any) => ({ ...d, hero: A(d.hero), stops: d.stops as Stop[] }))
  attractions = (raw.attractions || []).map((s: any) => ({ ...s, img: A(s.img) }))
  places = (raw.places || []).map((s: any) => ({ ...s, img: A(s.img) }))
}

export function setCurrentTripId(id: string) { currentTripId = id }

export async function loadTrip(tripId: string): Promise<void> {
  currentTripId = tripId
  if (import.meta.env.VITE_USE_SUPABASE === 'true') {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    const res = await fetch(
      `${url}/rest/v1/trips?id=eq.${encodeURIComponent(tripId)}&select=data`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    )
    if (!res.ok) throw new Error(`supabase trips/${tripId} ${res.status}`)
    const rows = await res.json()
    if (!rows.length) throw new Error(`trip ${tripId} not found`)
    initTrip(rows[0].data)
  } else {
    const res = await fetch(`${import.meta.env.BASE_URL}trips/${tripId}.json`, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`trips/${tripId}.json ${res.status}`)
    initTrip(await res.json())
  }
}
