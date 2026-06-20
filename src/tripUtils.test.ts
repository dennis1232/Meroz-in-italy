import { describe, it, expect } from 'vitest'
import {
  parseLatLng, isoToFields, toRaw, toClean, HEBREW_DOW, TAGS, TAG_LABEL,
  type TripRaw
} from './tripUtils'

describe('parseLatLng', () => {
  it('parses raw "lat, lng"', () => {
    expect(parseLatLng('43.7686, 11.262')).toEqual({ lat: '43.7686', lng: '11.262' })
    expect(parseLatLng('43.7686,11.262')).toEqual({ lat: '43.7686', lng: '11.262' })
  })

  it('parses Google Maps /@lat,lng links', () => {
    expect(parseLatLng('https://www.google.com/maps/@43.7731,11.256,17z'))
      .toEqual({ lat: '43.7731', lng: '11.256' })
  })

  it('parses Google place !3d!4d links', () => {
    expect(parseLatLng('https://www.google.com/maps/place/X/data=!3d41.8902!4d12.4922'))
      .toEqual({ lat: '41.8902', lng: '12.4922' })
  })

  it('prefers the place pin (!3d!4d) over the viewport (@) when both present', () => {
    const url = 'https://www.google.com/maps/place/X/@43.0,11.0,17z/data=!3d41.8902!4d12.4922'
    expect(parseLatLng(url)).toEqual({ lat: '41.8902', lng: '12.4922' })
  })

  it('parses query=/ll=/q=/center= params', () => {
    expect(parseLatLng('https://maps.google.com/?q=43.31,11.33')).toEqual({ lat: '43.31', lng: '11.33' })
    expect(parseLatLng('https://www.google.com/maps/search/?api=1&query=43.31,11.33'))
      .toEqual({ lat: '43.31', lng: '11.33' })
    expect(parseLatLng('https://example.com/?ll=43.31,11.33')).toEqual({ lat: '43.31', lng: '11.33' })
  })

  it('parses Waze links (to=ll. with encoded comma)', () => {
    expect(parseLatLng('https://www.waze.com/ul?ll=32.0853,34.7818')).toEqual({ lat: '32.0853', lng: '34.7818' })
    expect(parseLatLng('https://waze.com/live-map/directions?to=ll.43.77%2C11.26'))
      .toEqual({ lat: '43.77', lng: '11.26' })
  })

  it('handles negative coordinates', () => {
    expect(parseLatLng('-33.8688, 151.2093')).toEqual({ lat: '-33.8688', lng: '151.2093' })
  })

  it('returns null for empty / non-coordinate text', () => {
    expect(parseLatLng('')).toBeNull()
    expect(parseLatLng('   ')).toBeNull()
    expect(parseLatLng('Colosseo, Roma')).toBeNull()
    expect(parseLatLng('https://maps.app.goo.gl/abc123')).toBeNull()
  })
})

describe('isoToFields', () => {
  it('derives dd/mm, Hebrew day-of-week and English label', () => {
    // 2026-06-22 is a Monday
    expect(isoToFields('2026-06-22')).toEqual({ date: '22/06', dow: 'יום שני', en: 'June 22' })
  })

  it('zero-pads day and month', () => {
    expect(isoToFields('2026-07-01').date).toBe('01/07')
  })

  it('maps Saturday to שבת (no יום prefix)', () => {
    // 2026-06-27 is a Saturday
    expect(isoToFields('2026-06-27').dow).toBe('שבת')
  })

  it('maps Sunday to יום ראשון', () => {
    // 2026-06-28 is a Sunday
    expect(isoToFields('2026-06-28').dow).toBe('יום ראשון')
  })

  it('HEBREW_DOW has 7 entries, Sunday-first', () => {
    expect(HEBREW_DOW).toHaveLength(7)
    expect(HEBREW_DOW[0]).toBe('יום ראשון')
    expect(HEBREW_DOW[6]).toBe('שבת')
  })
})

describe('TAGS / TAG_LABEL', () => {
  it('every tag has a label', () => {
    for (const t of TAGS) expect(TAG_LABEL[t]).toBeTruthy()
  })
})

const sampleTrip = (): TripRaw => ({
  meta: { title: 'T', subtitle: 'S', country: 'Italy', startISO: '2026-06-22', endISO: '2026-07-04', who: 'us', cover: 'cover.webp', lang: 'he' as const },
  contact: { instagram: 'x', phoneIL: '+972 1', phoneILraw: '+9721', phoneIT: '+39 2', phoneITraw: '+392' },
  days: [{
    n: 1, date: '22/06', dow: 'יום שני', en: 'June 22', iso: '2026-06-22', hero: 'day01.webp',
    title: 'Day', intro: 'hi',
    stops: [
      { name: 'Flight', time: '13:45', desc: 'land', move: true, via: 'flight' },
      { name: 'Hotel', tag: 'hotel', lat: '43.77', lng: '11.26' },
      { name: 'Parking', parking: true, lat: '43.31', lng: '11.33' },
      { name: 'No coords' }
    ]
  }],
  attractions: [{ name: 'A', he: 'אא', desc: 'd', img: 'a.webp', lat: '43.0', lng: '11.0' }],
  places: [{ name: 'P', he: 'פפ', desc: 'd', img: 'p.webp', lat: '', lng: '' }]
})

describe('toClean', () => {
  it('converts lat/lng strings to numbers', () => {
    const c = toClean(sampleTrip())
    expect(c.days[0].stops[1].lat).toBe(43.77)
    expect(c.days[0].stops[1].lng).toBe(11.26)
    expect(typeof c.days[0].stops[1].lat).toBe('number')
  })

  it('omits lat/lng when blank or invalid', () => {
    const c = toClean(sampleTrip())
    expect(c.days[0].stops[3]).not.toHaveProperty('lat')
    expect(c.places[0]).not.toHaveProperty('lat')
  })

  it('omits falsy optional flags but keeps true ones', () => {
    const c = toClean(sampleTrip())
    const flight = c.days[0].stops[0]
    expect(flight.move).toBe(true)
    expect(flight.via).toBe('flight')
    expect(flight).not.toHaveProperty('tag')
    expect(flight).not.toHaveProperty('parking')
    expect(c.days[0].stops[2].parking).toBe(true)
  })

  it('always keeps name; keeps time/desc/tag when present', () => {
    const c = toClean(sampleTrip())
    expect(c.days[0].stops[0].name).toBe('Flight')
    expect(c.days[0].stops[0].time).toBe('13:45')
    expect(c.days[0].stops[1].tag).toBe('hotel')
  })

  it('preserves meta, contact, and day scalar fields', () => {
    const c = toClean(sampleTrip())
    expect(c.meta.title).toBe('T')
    expect(c.contact.instagram).toBe('x')
    expect(c.days[0].iso).toBe('2026-06-22')
    expect(c.days[0].hero).toBe('day01.webp')
  })
})

describe('toRaw', () => {
  it('stringifies numeric lat/lng', () => {
    const r = toRaw({
      meta: {}, contact: {},
      days: [{ n: 1, stops: [{ name: 'x', lat: 43.77, lng: 11.26 }] }],
      attractions: [], places: []
    })
    expect(r.days[0].stops[0].lat).toBe('43.77')
    expect(r.days[0].stops[0].lng).toBe('11.26')
  })

  it('represents missing lat/lng as empty string', () => {
    const r = toRaw({ meta: {}, contact: {}, days: [{ n: 1, stops: [{ name: 'x' }] }], attractions: [], places: [] })
    expect(r.days[0].stops[0].lat).toBe('')
  })

  it('tolerates missing days/attractions/places', () => {
    const r = toRaw({ meta: {}, contact: {} })
    expect(r.days).toEqual([])
    expect(r.attractions).toEqual([])
    expect(r.places).toEqual([])
  })

  it('normalises spot fields with defaults', () => {
    const r = toRaw({ meta: {}, contact: {}, attractions: [{ name: 'A' }], places: [] })
    expect(r.attractions[0]).toEqual({ name: 'A', he: '', desc: '', img: '', lat: '', lng: '' })
  })
})

describe('toRaw ↔ toClean round-trip', () => {
  it('toRaw(toClean(x)) is stable (idempotent shape)', () => {
    const raw = sampleTrip()
    const once = toRaw(toClean(raw))
    const twice = toRaw(toClean(once))
    expect(twice).toEqual(once)
  })

  it('coordinates survive a round-trip as numbers', () => {
    const clean = toClean(toRaw(toClean(sampleTrip())))
    expect(clean.days[0].stops[1].lat).toBe(43.77)
  })
})
