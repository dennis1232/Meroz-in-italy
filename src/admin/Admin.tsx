import { useState, useEffect, useRef } from 'react'
import { rawTrip } from '../store'
import { toRaw, toClean, type DayRaw, type TripRaw } from '../tripUtils'
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

  const saveToCloud = async () => {
    setSaving(true)
    setSaveErr('')
    try {
      await saveTrip(tripId, toClean(trip))
    } catch (e) {
      setSaveErr(String(e))
    } finally {
      setSaving(false)
    }
  }

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
        <AdminNav days={trip.days} onNav={navTo} onAddDay={addDay} />

        <div className="adm-main">
          <AdminCoverSection meta={trip.meta} onMeta={setMeta} />

          <div className="adm-section">
            <div className="adm-stops-hd">
              <h2>Days ({trip.days.length})</h2>
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
