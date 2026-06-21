import type { Day, TripMeta } from '../../types'

function isoToIcsDate(iso: string): string {
  return iso.replace(/-/g, '')
}

function nextDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}${mm}${dd}`
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function generateIcs(meta: TripMeta, days: Day[]): string {
  const events = days
    .filter((d) => d.iso)
    .map((d) => {
      const stopNames = d.stops.map((s) => s.name).filter(Boolean).join(', ')
      const summary = escapeIcs(`${meta.title ? meta.title + ' — ' : ''}${d.title || `Day ${d.n}`}`)
      const desc = escapeIcs(stopNames)
      return [
        'BEGIN:VEVENT',
        `DTSTART;VALUE=DATE:${isoToIcsDate(d.iso!)}`,
        `DTEND;VALUE=DATE:${nextDay(d.iso!)}`,
        `SUMMARY:${summary}`,
        desc ? `DESCRIPTION:${desc}` : null,
        `UID:day-${d.n}-${meta.title.replace(/\s+/g, '-')}@meroz`,
        'END:VEVENT',
      ].filter(Boolean).join('\r\n')
    })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Meroz//Trip Guide//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadCalendar(meta: TripMeta, days: Day[]): void {
  const ics = generateIcs(meta, days)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${meta.title || 'trip'}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
