import { useState, useEffect, useRef, useCallback } from 'react'
import { rawTrip } from '../store'
import { toRaw, toClean, isoToFields, type DayRaw, type TripRaw } from '../tripUtils'
import { saveTrip } from '../cloud'
import { copyTripLink } from '../ui'
import AdminTopbar from './AdminTopbar'
import AdminNav from './AdminNav'
import AdminCoverSection from './AdminCoverSection'
import AdminContactSection from './AdminContactSection'
import DayEditor from './DayEditor'
import SpotSection from './SpotSection'

type Props = { tripId: string }

export default function Admin({ tripId }: Props) {
  const [trip, setTrip] = useState<TripRaw>(() => {
    const saved = localStorage.getItem(`draft-${tripId}`)
    if (saved) {
      try { return JSON.parse(saved) } catch { localStorage.removeItem(`draft-${tripId}`) }
    }
    return toRaw(rawTrip ?? { meta: { lang: 'he' }, contact: {}, days: [], attractions: [], places: [] })
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [shareMsg, setShareMsg] = useState('')
  const [activeId, setActiveId] = useState('adm-cover')
  const broadcastRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    broadcastRef.current = new BroadcastChannel(`meroz-trip-${tripId}`)
    return () => { broadcastRef.current?.close() }
  }, [tripId])

  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem(`draft-${tripId}`, JSON.stringify(trip))
      const clean = toClean(trip)
      localStorage.setItem(`preview-${tripId}`, JSON.stringify(clean))
      broadcastRef.current?.postMessage(clean)
      setSaved(true)
      const t = setTimeout(() => setSaved(false), 1400)
      return () => clearTimeout(t)
    }, 500)
    return () => clearTimeout(id)
  }, [trip, tripId])

  // scroll-spy
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveId(e.target.id) })
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
    )
    const ids = ['adm-cover', ...trip.days.map(d => `adm-day-${d.n}`), 'adm-recs', 'adm-contact']
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [trip.days.length])

  const saveToCloud = useCallback(async () => {
    setSaving(true)
    setSaveErr('')
    try {
      await saveTrip(tripId, toClean(trip))
    } catch (e) {
      setSaveErr(String(e))
    } finally {
      setSaving(false)
    }
  }, [tripId, trip])

  // Cmd+S / Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        saveToCloud()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [saveToCloud])

  const setMeta = (k: keyof TripRaw['meta'], v: string) =>
    setTrip({ ...trip, meta: { ...trip.meta, [k]: v } })

  const setDay = (i: number, d: DayRaw) => {
    const days = [...trip.days]
    days[i] = d
    setTrip({ ...trip, days })
  }

  const delDay = (i: number) => {
    if (!confirm(`Delete Day ${trip.days[i].n}?`)) return
    const days = trip.days.filter((_, j) => j !== i).map((d, idx) => ({ ...d, n: idx + 1 }))
    setTrip({ ...trip, days })
  }

  const addDay = () => {
    const n = trip.days.length + 1
    setTrip({
      ...trip,
      days: [...trip.days, { n, date: '', dow: '', en: '', iso: '', hero: '', title: '', intro: '', stops: [] }]
    })
  }

  const generateDaysFromDates = () => {
    const { startISO, endISO } = trip.meta
    if (!startISO || !endISO) return
    const existingIsos = new Set(trip.days.map(d => d.iso))
    const newDays: DayRaw[] = []
    const cur = new Date(startISO + 'T00:00:00')
    const end = new Date(endISO + 'T00:00:00')
    while (cur <= end) {
      const iso = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`
      if (!existingIsos.has(iso)) {
        const f = isoToFields(iso)
        newDays.push({ n: 0, iso, date: f.date, dow: f.dow, en: f.en, hero: '', title: '', intro: '', stops: [] })
      }
      cur.setDate(cur.getDate() + 1)
    }
    const allDays = [...trip.days, ...newDays]
      .sort((a, b) => (a.iso ?? '').localeCompare(b.iso ?? ''))
      .map((d, i) => ({ ...d, n: i + 1 }))
    setTrip({ ...trip, days: allDays })
  }

  const canGenerateDays = !!(trip.meta.startISO && trip.meta.endISO)

  const navTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const shareLink = () => {
    copyTripLink(tripId).then(() => {
      setShareMsg('✓ copied')
      setTimeout(() => setShareMsg(''), 2000)
    })
  }

  const preview = () => {
    localStorage.setItem(`preview-${tripId}`, JSON.stringify(toClean(trip)))
    window.open(`/trip/${tripId}?preview`, '_blank')
  }

  return (
    <div className="adm-root" dir="ltr">
      <AdminTopbar
        tripId={tripId}
        saved={saved}
        saving={saving}
        saveErr={saveErr}
        shareMsg={shareMsg}
        onSave={saveToCloud}
        onPreview={preview}
        onShare={shareLink}
      />

      <div className="adm-body">
        <AdminNav days={trip.days} activeId={activeId} onNav={navTo} onAddDay={addDay} />

        <div className="adm-main">
          <AdminCoverSection meta={trip.meta} onMeta={setMeta} />

          <div className="adm-section">
            <div className="adm-stops-hd">
              <h2>Days ({trip.days.length})</h2>
              {canGenerateDays && (
                <button className="adm-add" onClick={generateDaysFromDates}>⚡ Generate from dates</button>
              )}
            </div>
            {trip.days.map((d, i) => (
              <DayEditor
                key={i}
                id={`adm-day-${d.n}`}
                day={d}
                onChange={(nd) => setDay(i, nd)}
                onDelete={() => delDay(i)}
              />
            ))}
          </div>

          <div id="adm-recs" className="adm-section">
            <h2>Recommendations</h2>
            <SpotSection
              title="⭐ Attractions (must-see)"
              list={trip.attractions}
              onChange={(l) => setTrip({ ...trip, attractions: l })}
            />
            <SpotSection
              title="📍 Places"
              list={trip.places}
              onChange={(l) => setTrip({ ...trip, places: l })}
            />
          </div>

          <AdminContactSection
            contact={trip.contact}
            onChange={(contact) => setTrip({ ...trip, contact })}
          />

          <div className="adm-hint">
            <b>☁️ Publish:</b> Click <b>Save</b> to publish to Supabase, then <b>Copy link</b> to share with travelers.
          </div>

        </div>
      </div>
    </div>
  )
}
