import { useEffect, useState, type MouseEvent } from 'react'
import { isCloudinaryConfigured } from './cloud'
import { copyTripLink } from './ui'

type TripEntry = { id: string; title: string; startISO: string; endISO: string }

export default function AdminHome() {
  const [trips, setTrips] = useState<TripEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}trips/index.json`, { cache: 'no-cache' })
      .then(r => { if (!r.ok) throw new Error(r.status.toString()); return r.json() })
      .then(setTrips)
      .catch(e => setError(`Could not load trips/index.json: ${e.message}`))
  }, [])

  const newTrip = () => {
    const id = prompt('Trip ID (lowercase, hyphens only — e.g. cohen-france-2027):')?.trim()
    if (!id || !/^[a-z0-9-]+$/.test(id)) return
    location.href = `/admin/${id}`
  }

  const copyLink = (e: MouseEvent, trip: TripEntry) => {
    e.stopPropagation()
    copyTripLink(trip.id).then(() => {
      setCopiedId(trip.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  return (
    <div className="adm-root" dir="ltr">
      <div className="adm-topbar">
        <h1>✏️ Trips</h1>
        <div className="adm-actions">
          <button className="adm-btn" onClick={newTrip}>+ New trip</button>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        {!isCloudinaryConfigured() && (
          <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#92400e' }}>
            ⚠️ Cloudinary not configured — images will be stored as data URLs (large). Set{' '}
            <code style={{ fontSize: 12 }}>VITE_CLOUDINARY_CLOUD</code> and{' '}
            <code style={{ fontSize: 12 }}>VITE_CLOUDINARY_PRESET</code> in Netlify env vars, then redeploy.
          </div>
        )}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!error && trips.length === 0 && <p style={{ color: '#888' }}>No trips in trips/index.json.</p>}
        {trips.map(t => (
          <div
            key={t.id}
            className="adm-day"
            style={{ marginBottom: 12, cursor: 'pointer' }}
            onClick={() => location.href = `/admin/${t.id}`}
          >
            <div className="adm-day-hd" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <b style={{ flex: 1 }}>{t.title}</b>
              <span style={{ fontSize: 13, color: '#888' }}>{t.startISO} – {t.endISO}</span>
              <span style={{ fontSize: 12, color: '#aaa', fontFamily: 'monospace' }}>{t.id}</span>
              <button
                className="adm-btn"
                style={{ fontSize: 12, padding: '4px 10px', flexShrink: 0 }}
                onClick={(e) => copyLink(e, t)}
              >
                {copiedId === t.id ? '✓ copied' : '🔗 Copy link'}
              </button>
              <span style={{ color: '#666' }}>›</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
