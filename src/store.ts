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
  const res = await fetch(`${import.meta.env.BASE_URL}trips/${tripId}.json`, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`trips/${tripId}.json ${res.status}`)
  initTrip(await res.json())
}
