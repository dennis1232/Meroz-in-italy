import { describe, it, expect } from 'vitest'
import { navForStop, colorFor, dayColors, gmaps, waze } from './ui'
import type { Stop } from './data'

const place = (over: Partial<Stop> = {}): Stop => ({ name: 'place', ...over })

describe('navForStop', () => {
  it('a car drive with its own pin → Waze to itself', () => {
    const stops = [place({ name: 'drive', move: true, lat: 43.7, lng: 11.2 }), place({ name: 'end' })]
    const n = navForStop(stops, 0)
    expect(n.isDrive).toBe(true)
    expect(n.icon).toBe('🚗')
    expect(n.wazeTarget?.name).toBe('drive')
  })

  it('a car drive with no pin → Waze to the next pinned stop', () => {
    const stops = [place({ name: 'drive', move: true }), place({ name: 'dest', lat: 43.3, lng: 11.3 })]
    expect(navForStop(stops, 0).wazeTarget?.name).toBe('dest')
  })

  it('suppresses drive Waze when a parking stop follows before the next leg', () => {
    const stops = [
      place({ name: 'drive', move: true, lat: 43.7, lng: 11.2 }),
      place({ name: 'park', parking: true, lat: 43.3, lng: 11.3 }),
      place({ name: 'town', lat: 43.31, lng: 11.33 })
    ]
    expect(navForStop(stops, 0).wazeTarget).toBeUndefined()
  })

  it('train/flight legs are not drives and get no Waze target', () => {
    const train = [place({ name: 'train', move: true, via: 'train' })]
    expect(navForStop(train, 0).isDrive).toBe(false)
    expect(navForStop(train, 0).icon).toBe('🚆')
    expect(navForStop(train, 0).wazeTarget).toBeUndefined()

    const flight = [place({ name: 'fly', move: true, via: 'flight' })]
    expect(navForStop(flight, 0).icon).toBe('✈️')
  })

  it('a non-move place has no icon and no waze target', () => {
    const n = navForStop([place({ name: 'site', lat: 1, lng: 2 })], 0)
    expect(n.isDrive).toBe(false)
    expect(n.icon).toBeNull()
    expect(n.wazeTarget).toBeUndefined()
  })

  it('only parking before the NEXT leg matters (parking after a later leg does not suppress)', () => {
    const stops = [
      place({ name: 'drive', move: true, lat: 43.7, lng: 11.2 }),
      place({ name: 'town', lat: 43.3, lng: 11.3 }),
      place({ name: 'drive2', move: true }),
      place({ name: 'park', parking: true, lat: 43.1, lng: 11.8 })
    ]
    expect(navForStop(stops, 0).wazeTarget?.name).toBe('drive')
  })
})

describe('colorFor', () => {
  it('cycles through the palette by day number', () => {
    expect(colorFor(1)).toBe(dayColors[1])
    expect(colorFor(dayColors.length)).toBe(dayColors[0])
  })
})

describe('gmaps / waze', () => {
  it('gmaps searches by name + Italy', () => {
    expect(gmaps({ name: 'Duomo' })).toBe('https://www.google.com/maps/search/?api=1&query=Duomo%20Italy')
  })
  it('waze uses the waze:// deep link with coords', () => {
    expect(waze({ lat: 43.77, lng: 11.26 })).toBe('waze://?ll=43.77,11.26&navigate=yes')
  })
})
