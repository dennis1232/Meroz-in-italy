import { useEffect, useState } from 'react'
import { getConfig, isCloudinaryFromEnv, saveConfig } from './cloud'

type TripEntry = { id: string; title: string; startISO: string; endISO: string }

function Settings({ onClose }: { onClose: () => void }) {
  const fromEnv = isCloudinaryFromEnv()
  const current = getConfig()
  const [cloud, setCloud] = useState(current?.cloudinaryCloud ?? '')
  const [preset, setPreset] = useState(current?.cloudinaryPreset ?? '')

  const save = () => {
    saveConfig({ cloudinaryCloud: cloud.trim(), cloudinaryPreset: preset.trim() })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: 420, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>⚙️ Cloud Settings</h2>

        {fromEnv ? (
          <>
            <div style={{ background: '#ecfdf5', border: '1px solid #86efac', borderRadius: 8, padding: 12, fontSize: 13, color: '#166534' }}>
              Cloudinary is configured via <code style={{ fontSize: 12 }}>.env</code> — edit
              {' '}<code style={{ fontSize: 12 }}>VITE_CLOUDINARY_CLOUD</code> and{' '}
              <code style={{ fontSize: 12 }}>VITE_CLOUDINARY_PRESET</code>, then restart the dev server.
            </div>
            <div style={{ fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div><b>Cloud name:</b> {current?.cloudinaryCloud}</div>
              <div><b>Upload preset:</b> {current?.cloudinaryPreset}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="adm-btn" onClick={onClose} style={{ background: '#1e293b' }}>Close</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: 12, fontSize: 13, color: '#0369a1' }}>
              Images are uploaded to Cloudinary. Set <code style={{ fontSize: 12 }}>VITE_CLOUDINARY_*</code> in{' '}
              <code style={{ fontSize: 12 }}>.env</code>, or enter values here (saved in this browser).
              Create an <b>unsigned upload preset</b> at cloudinary.com → Settings → Upload.
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
              Cloudinary cloud name
              <input
                style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                value={cloud}
                onChange={e => setCloud(e.target.value)}
                placeholder="e.g. my-cloud-abc123"
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
              Upload preset name (unsigned)
              <input
                style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                value={preset}
                onChange={e => setPreset(e.target.value)}
                placeholder="e.g. meroz-trips"
              />
            </label>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="adm-btn" onClick={onClose} style={{ background: '#e5e7eb', color: '#374151' }}>Cancel</button>
              <button className="adm-btn" onClick={save} style={{ background: '#1e293b' }}>Save settings</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminHome() {
  const [trips, setTrips] = useState<TripEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const cloudConfigured = !!getConfig()?.cloudinaryCloud

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

  return (
    <div className="adm-root" dir="ltr">
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}

      <div className="adm-topbar">
        <h1>✏️ Trips</h1>
        <div className="adm-actions">
          <button className="adm-btn" onClick={newTrip}>+ New trip</button>
          <button
            className="adm-btn"
            onClick={() => setShowSettings(true)}
            title={cloudConfigured ? 'Cloudinary configured ✓' : 'Configure Cloudinary'}
            style={{ background: cloudConfigured ? '#166534' : undefined }}
          >
            ⚙️ Settings {cloudConfigured ? '✓' : ''}
          </button>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        {!cloudConfigured && (
          <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#92400e' }}>
            ⚠️ Cloudinary not configured — images will be stored as data URLs (large). <button style={{ background: 'none', border: 'none', color: '#b45309', cursor: 'pointer', textDecoration: 'underline', padding: 0 }} onClick={() => setShowSettings(true)}>Configure now</button>
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
              <span style={{ color: '#666' }}>›</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
