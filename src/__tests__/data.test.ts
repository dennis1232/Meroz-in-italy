import { describe, it, expect, beforeEach } from 'vitest'
import realTrip from '../../public/trip.json'
import { A, ddmm } from '../types'
import { initTrip, days, attractions, places, meta, contact } from '../store'
import { toRaw, toClean } from '../tripUtils'

describe('A (image resolver)', () => {
  it('prefixes bare filenames with /assets/', () => {
    expect(A('cover.webp')).toBe('/assets/cover.webp')
    expect(A('day01.webp')).toBe('/assets/day01.webp')
  })
  it('passes through data: URLs unchanged', () => {
    const d = 'data:image/webp;base64,AAAA'
    expect(A(d)).toBe(d)
  })
  it('passes through http(s) URLs unchanged', () => {
    expect(A('https://x.com/a.jpg')).toBe('https://x.com/a.jpg')
    expect(A('http://x.com/a.jpg')).toBe('http://x.com/a.jpg')
  })
  it('passes through absolute paths unchanged', () => {
    expect(A('/already/abs.png')).toBe('/already/abs.png')
  })
  it('returns empty string untouched', () => {
    expect(A('')).toBe('')
  })
})

describe('ddmm', () => {
  it('formats ISO date as dd/mm', () => {
    expect(ddmm('2026-06-22')).toBe('22/06')
    expect(ddmm('2026-07-04')).toBe('04/07')
  })
  it('returns empty for empty input', () => {
    expect(ddmm('')).toBe('')
  })
})

describe('initTrip (live bindings)', () => {
  beforeEach(() => {
    initTrip({
      meta: { title: 'T', subtitle: 'S', startISO: '2026-06-22', endISO: '2026-07-04', who: 'w', cover: 'cover.webp' },
      contact: { instagram: 'ig', phoneIL: '1', phoneILraw: '1', phoneIT: '2', phoneITraw: '2' },
      days: [{ n: 1, date: '22/06', dow: 'יום שני', en: 'June 22', hero: 'day01.webp', title: 'X', intro: 'i', stops: [{ name: 's' }] }],
      attractions: [{ name: 'A', desc: 'd', img: 'a.webp', lat: 1, lng: 2 }],
      places: [{ name: 'P', desc: 'd', img: 'data:image/webp;base64,ZZ', lat: 3, lng: 4 }]
    })
  })

  it('populates meta and contact', () => {
    expect(meta.title).toBe('T')
    expect(meta.startISO).toBe('2026-06-22')
    expect(contact.instagram).toBe('ig')
  })

  it('resolves day hero through A()', () => {
    expect(days[0].hero).toBe('/assets/day01.webp')
    expect(days).toHaveLength(1)
  })

  it('resolves attraction/place images, passing data URLs through', () => {
    expect(attractions[0].img).toBe('/assets/a.webp')
    expect(places[0].img).toBe('data:image/webp;base64,ZZ')
  })

  it('keeps stop data intact', () => {
    expect(days[0].stops[0].name).toBe('s')
  })
})

describe('public/trip.json (real data regression)', () => {
  it('has well-formed meta', () => {
    expect(realTrip.meta.startISO).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(realTrip.meta.endISO).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(realTrip.meta.cover).toBeTruthy()
  })

  it('days are sequentially numbered from 1', () => {
    realTrip.days.forEach((d, i) => expect(d.n).toBe(i + 1))
  })

  it('every day has date, dow, title and a stops array', () => {
    for (const d of realTrip.days) {
      expect(d.date).toMatch(/^\d{2}\/\d{2}$/)
      expect(d.dow).toBeTruthy()
      expect(Array.isArray(d.stops)).toBe(true)
    }
  })

  it('every stop has a name; coords (when present) are finite numbers', () => {
    for (const d of realTrip.days) {
      for (const s of d.stops as any[]) {
        expect(s.name).toBeTruthy()
        if (s.lat != null) expect(Number.isFinite(s.lat)).toBe(true)
        if (s.lng != null) expect(Number.isFinite(s.lng)).toBe(true)
      }
    }
  })

  it('move legs use only train|flight when via is set', () => {
    for (const d of realTrip.days)
      for (const s of d.stops as any[])
        if (s.via) expect(['train', 'flight']).toContain(s.via)
  })

  it('tags are from the known set', () => {
    const known = ['food', 'cafe', 'site', 'wine', 'gelato', 'hotel', 'shop']
    for (const d of realTrip.days)
      for (const s of d.stops as any[])
        if (s.tag) expect(known).toContain(s.tag)
  })

  it('survives a toRaw → toClean round-trip without losing days/stops', () => {
    const clean = toClean(toRaw(realTrip))
    expect(clean.days).toHaveLength(realTrip.days.length)
    clean.days.forEach((d, i) => expect(d.stops).toHaveLength(realTrip.days[i].stops.length))
  })
})
