import { useState, useCallback, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import { rawTrip, A } from './data'
import {
  TAGS, TAG_LABEL, isoToFields, parseLatLng, toRaw, toClean,
  type StopRaw, type SpotRaw, type DayRaw, type TripRaw
} from './tripUtils'
import { uploadImage, saveTrip, isCloudinaryConfigured } from './cloud'
import { copyTripLink } from './ui'

declare global {
  interface Window {
    showOpenFilePicker?: (opts?: unknown) => Promise<FileSystemFileHandle[]>
  }
}
declare class FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>
}
declare class FileSystemWritableFileStream {
  write(data: string): Promise<void>
  close(): Promise<void>
}

// Load an image file, downscale, and return a webp data URL (keeps trip.json small).
function fileToDataUrl(file: File, maxW = 1400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxW / img.width)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')
      if (!ctx) return reject(new Error('no canvas ctx'))
      ctx.drawImage(img, 0, 0, w, h)
      resolve(c.toDataURL('image/webp', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

function download(obj: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

async function expandShortUrl(url: string): Promise<string> {
  const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
  if (!res.ok) throw new Error('proxy error')
  const json = await res.json()
  return (json.status?.url as string | undefined) ?? url
}

function linkForCoords(lat: string, lng: string, source: string): string {
  if (/waze\.com/i.test(source)) {
    return `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`
  }
  return `https://www.google.com/maps?q=${lat},${lng}`
}

function LocMap({ lat, lng }: { lat: number; lng: number }) {
  const pos: [number, number] = [lat, lng]
  function Center() {
    const map = useMap()
    useEffect(() => {
      map.setView([lat, lng], 15)
      const t = setTimeout(() => map.invalidateSize(), 60)
      return () => clearTimeout(t)
    }, [lat, lng, map])
    return null
  }
  return (
    <MapContainer center={pos} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
      <Center />
      <Marker position={pos} />
    </MapContainer>
  )
}

// ── Reusable: location paste field ────────────────────────────────────────────
function LocationField({
  lat, lng, mapLink, onSet
}: {
  lat?: string
  lng?: string
  mapLink?: string
  onSet: (lat: string, lng: string, mapLink?: string) => void
}) {
  const [paste, setPaste] = useState('')
  const [err, setErr] = useState(false)
  const [expanding, setExpanding] = useState(false)

  const displayUrl = mapLink || (lat && lng ? linkForCoords(lat, lng, mapLink ?? '') : '')
  const inputValue = paste || displayUrl

  const apply = async (v: string) => {
    setPaste(v)
    setErr(false)
    if (!v.trim()) {
      onSet('', '', '')
      return
    }
    let target = v.trim()
    if (/maps\.app\.goo\.gl/.test(target)) {
      setExpanding(true)
      try { target = await expandShortUrl(target) }
      catch { setErr(true); setExpanding(false); return }
      setExpanding(false)
    }
    const r = parseLatLng(target)
    if (r) {
      const storedLink = /^(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/.test(v.trim())
        ? linkForCoords(r.lat, r.lng, v)
        : (/maps\.app\.goo\.gl/.test(v.trim()) ? target : v.trim())
      onSet(r.lat, r.lng, storedLink)
      setErr(false)
      setPaste('')
    } else setErr(true)
  }

  const clear = () => {
    setPaste('')
    setErr(false)
    onSet('', '', '')
  }

  return (
    <div className="adm-loc">
      <label>
        📍 Paste Google Maps / Waze link
        <input
          value={inputValue}
          placeholder="https://maps.app.goo.gl/...  or  43.77, 11.26"
          onChange={(e) => apply(e.target.value)}
        />
      </label>
      {expanding && <div className="adm-loc-no">⏳ extracting coordinates…</div>}
      {!expanding && lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng)) ? (
        <div className="adm-loc-map">
          <button type="button" className="adm-loc-clear" onClick={clear}>clear</button>
          <LocMap lat={parseFloat(lat)} lng={parseFloat(lng)} />
        </div>
      ) : (
        !expanding && <div className="adm-loc-no">{err ? '⚠️ no coordinates found in that link' : 'no location set'}</div>
      )}
    </div>
  )
}

// ── Reusable: photo upload field ──────────────────────────────────────────────
function PhotoField({ label, value, onSet }: { label: string; value: string; onSet: (v: string) => void }) {
  const [busy, setBusy] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setUploadErr('')
    try {
      if (isCloudinaryConfigured()) {
        onSet(await uploadImage(file))
      } else {
        onSet(await fileToDataUrl(file))
      }
    } catch (err) {
      setUploadErr(String(err))
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }
  return (
    <div className="adm-photo">
      <div className="adm-photo-top">
        <span>{label}</span>
        <label className="adm-photo-btn">
          {busy ? '⏳…' : value ? '🔄 Replace' : '📷 Upload'}
          <input type="file" accept="image/*" onChange={pick} hidden />
        </label>
      </div>
      {uploadErr && <div style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{uploadErr}</div>}
      {value
        ? <img className="adm-photo-prev" src={A(value)} alt="" />
        : <div className="adm-photo-empty">no photo</div>}
    </div>
  )
}

// ── Stop editor ──────────────────────────────────────────────────────────────
function StopRow({
  stop, onChange, onDelete, onMove
}: {
  stop: StopRaw
  onChange: (s: StopRaw) => void
  onDelete: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const [open, setOpen] = useState(false)
  const set = (k: keyof StopRaw, v: unknown) => onChange({ ...stop, [k]: v })

  const label = stop.move
    ? `${stop.via === 'flight' ? '✈️' : stop.via === 'train' ? '🚆' : '🚗'} ${stop.name}`
    : stop.parking
    ? `🅿️ ${stop.name}`
    : `${stop.tag ? TAG_LABEL[stop.tag].split(' ')[0] : '•'} ${stop.name}`

  return (
    <div className="adm-stop">
      <div className="adm-stop-hd" onClick={() => setOpen((o) => !o)}>
        <span className="adm-stop-lbl">{label}</span>
        <div className="adm-stop-acts">
          <button onClick={(e) => { e.stopPropagation(); onMove(-1) }}>↑</button>
          <button onClick={(e) => { e.stopPropagation(); onMove(1) }}>↓</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="adm-del">✕</button>
          <span>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div className="adm-stop-body">
          <div className="adm-stop-left">
            <label>
              Name
              <input value={stop.name} onChange={(e) => set('name', e.target.value)} />
            </label>
            <div className="adm-row2">
              <label>
                Time
                <input value={stop.time || ''} placeholder="20:00" onChange={(e) => set('time', e.target.value || undefined)} />
              </label>
              <label>
                Tag
                <select value={stop.tag || ''} onChange={(e) => set('tag', e.target.value || undefined)}>
                  <option value="">—</option>
                  {TAGS.map((t) => <option key={t} value={t}>{TAG_LABEL[t]}</option>)}
                </select>
              </label>
            </div>
            <label>
              Description
              <textarea rows={3} value={stop.desc || ''} onChange={(e) => set('desc', e.target.value || undefined)} />
            </label>
          </div>
          <div className="adm-stop-right">
            <LocationField
              lat={stop.lat}
              lng={stop.lng}
              mapLink={stop.mapLink}
              onSet={(la, ln, link) => onChange({
                ...stop,
                lat: la || undefined,
                lng: ln || undefined,
                mapLink: link || undefined
              })}
            />
            <div className="adm-checks">
              <label>
                <input type="checkbox" checked={!!stop.move} onChange={(e) => set('move', e.target.checked || undefined)} />
                Move leg
              </label>
              <label>
                <input type="checkbox" checked={!!stop.parking} onChange={(e) => set('parking', e.target.checked || undefined)} />
                Parking
              </label>
              {stop.move && (
                <label>
                  Via
                  <select value={stop.via || ''} onChange={(e) => set('via', e.target.value || undefined)}>
                    <option value="">🚗 drive</option>
                    <option value="train">🚆 train</option>
                    <option value="flight">✈️ flight</option>
                  </select>
                </label>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Day editor ───────────────────────────────────────────────────────────────
function DayEditor({ day, onChange, onDelete, id }: { day: DayRaw; onChange: (d: DayRaw) => void; onDelete: () => void; id?: string }) {
  const [open, setOpen] = useState(false)
  const set = (k: keyof DayRaw, v: unknown) => onChange({ ...day, [k]: v })

  const setDate = (iso: string) => {
    if (!iso) { onChange({ ...day, iso: '' }); return }
    const f = isoToFields(iso)
    onChange({ ...day, iso, date: f.date, dow: f.dow, en: f.en })
  }

  const setStop = (i: number, s: StopRaw) => {
    const stops = [...day.stops]; stops[i] = s; set('stops', stops)
  }
  const delStop = (i: number) => set('stops', day.stops.filter((_, j) => j !== i))
  const moveStop = (i: number, dir: -1 | 1) => {
    const stops = [...day.stops]; const j = i + dir
    if (j < 0 || j >= stops.length) return
    ;[stops[i], stops[j]] = [stops[j], stops[i]]; set('stops', stops)
  }
  const addStop = () => set('stops', [...day.stops, { name: 'New stop' }])

  return (
    <div className="adm-day" id={id}>
      <div className="adm-day-hd" onClick={() => setOpen((o) => !o)}>
        <b>Day {day.n}</b>
        <span className="adm-day-title">{day.dow} · {day.date} — {day.title}</span>
        <button className="adm-del" onClick={(e) => { e.stopPropagation(); onDelete() }}>✕</button>
        <span>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="adm-day-body">
          <div className="adm-day-meta">
            <div className="adm-day-meta-left">
              <div className="adm-row2">
                <label>
                  📅 Date
                  <input type="date" value={day.iso || ''} onChange={(e) => setDate(e.target.value)} />
                </label>
                <div className="adm-derived">
                  {day.iso
                    ? <>→ {day.date} · {day.dow} · {day.en}</>
                    : 'pick a date'}
                </div>
              </div>
              <label>
                Title (banner)
                <input value={day.title} onChange={(e) => set('title', e.target.value)} />
              </label>
              <label>
                Intro
                <textarea rows={4} value={day.intro} onChange={(e) => set('intro', e.target.value)} />
              </label>
            </div>
            <div className="adm-day-meta-right">
              <PhotoField label="Hero photo" value={day.hero} onSet={(v) => set('hero', v)} />
            </div>
          </div>

          <div className="adm-stops-hd">
            <b>Stops ({day.stops.length})</b>
            <button className="adm-add" onClick={addStop}>+ Add stop</button>
          </div>
          {day.stops.map((s, i) => (
            <StopRow key={i} stop={s} onChange={(ns) => setStop(i, ns)} onDelete={() => delStop(i)} onMove={(dir) => moveStop(i, dir)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Spot (attraction/place) editor ────────────────────────────────────────────
function SpotRow({ spot, onChange, onDelete, onMove }: {
  spot: SpotRaw
  onChange: (s: SpotRaw) => void
  onDelete: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const [open, setOpen] = useState(false)
  const set = (k: keyof SpotRaw, v: string) => onChange({ ...spot, [k]: v })
  return (
    <div className="adm-stop">
      <div className="adm-stop-hd" onClick={() => setOpen((o) => !o)}>
        <span className="adm-stop-lbl">{spot.name || '(unnamed)'}</span>
        <div className="adm-stop-acts">
          <button onClick={(e) => { e.stopPropagation(); onMove(-1) }}>↑</button>
          <button onClick={(e) => { e.stopPropagation(); onMove(1) }}>↓</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="adm-del">✕</button>
          <span>{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div className="adm-stop-body">
          <div className="adm-row2">
            <label>Name (en)<input value={spot.name} onChange={(e) => set('name', e.target.value)} /></label>
            <label>Name (he)<input value={spot.he} onChange={(e) => set('he', e.target.value)} /></label>
          </div>
          <label>Description<textarea rows={2} value={spot.desc} onChange={(e) => set('desc', e.target.value)} /></label>
          <PhotoField label="Photo" value={spot.img} onSet={(v) => set('img', v)} />
          <LocationField
            lat={spot.lat}
            lng={spot.lng}
            mapLink={spot.mapLink}
            onSet={(la, ln, link) => onChange({ ...spot, lat: la, lng: ln, mapLink: link || undefined })}
          />
        </div>
      )}
    </div>
  )
}

function SpotSection({ title, list, onChange }: { title: string; list: SpotRaw[]; onChange: (l: SpotRaw[]) => void }) {
  const [open, setOpen] = useState(false)
  const setOne = (i: number, s: SpotRaw) => { const a = [...list]; a[i] = s; onChange(a) }
  const del = (i: number) => onChange(list.filter((_, j) => j !== i))
  const move = (i: number, dir: -1 | 1) => {
    const a = [...list]; const j = i + dir
    if (j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]; onChange(a)
  }
  const add = () => onChange([...list, { name: 'New', he: '', desc: '', img: '', lat: '', lng: '' }])
  return (
    <div className="adm-day">
      <div className="adm-day-hd" onClick={() => setOpen((o) => !o)}>
        <b>{title}</b>
        <span className="adm-day-title">{list.length} items</span>
        <span>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="adm-day-body">
          <div className="adm-stops-hd">
            <b>{list.length} items</b>
            <button className="adm-add" onClick={add}>+ Add</button>
          </div>
          {list.map((s, i) => (
            <SpotRow key={i} spot={s} onChange={(ns) => setOne(i, ns)} onDelete={() => del(i)} onMove={(dir) => move(i, dir)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main admin ───────────────────────────────────────────────────────────────
export default function Admin({ tripId }: { tripId: string }) {
  const [trip, setTrip] = useState<TripRaw>(() => {
    const saved = localStorage.getItem(`draft-${tripId}`)
    if (saved) return JSON.parse(saved)
    return toRaw(rawTrip ?? { meta: { lang: 'he' }, contact: {}, days: [], attractions: [], places: [] })
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [shareMsg, setShareMsg] = useState('')
  const [menu, setMenu] = useState(false)
  const [, force] = useState(0)
  const fileHandle = useRef<FileSystemFileHandle | null>(null)
  const hasFileApi = !!window.showOpenFilePicker
  const isLocal = typeof location !== 'undefined' && /^(localhost|127\.|192\.168\.)/.test(location.hostname)

  const writeToFile = useCallback(async (data: TripRaw) => {
    if (!fileHandle.current) return false
    try {
      const writable = await fileHandle.current.createWritable()
      await writable.write(JSON.stringify(toClean(data), null, 2))
      await writable.close()
      return true
    } catch { return false }
  }, [])

  const linkFile = useCallback(async () => {
    if (!window.showOpenFilePicker) return
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
      })
      fileHandle.current = handle
      const file = await (handle as any).getFile()
      try { setTrip(toRaw(JSON.parse(await file.text()))) } catch { /* keep */ }
      force((n) => n + 1)
    } catch { /* cancelled */ }
  }, [])

  // Autosave to the browser (and to the linked file when in dev) — no Save button needed.
  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem(`draft-${tripId}`, JSON.stringify(trip))
      const clean = toClean(trip)
      localStorage.setItem(`preview-${tripId}`, JSON.stringify(clean))
      if (fileHandle.current) writeToFile(trip)
      new BroadcastChannel(`meroz-trip-${tripId}`).postMessage(clean)
      setSaved(true)
      const t = setTimeout(() => setSaved(false), 1400)
      return () => clearTimeout(t)
    }, 500)
    return () => clearTimeout(id)
  }, [trip, tripId, writeToFile])

  const exportJson = () => download(toClean(trip), `${tripId}.json`)

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

  const resetDraft = () => {
    if (!confirm('Discard your draft and reload the published trip.json?')) return
    localStorage.removeItem(`draft-${tripId}`)
    setTrip(toRaw(rawTrip ?? { meta: { lang: 'he' }, contact: {}, days: [], attractions: [], places: [] }))
  }

  const importFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try { setTrip(toRaw(JSON.parse(ev.target!.result as string))) }
      catch { alert('Invalid JSON file') }
    }
    reader.readAsText(file)
  }

  const setMeta = (k: keyof TripRaw['meta'], v: string) =>
    setTrip({ ...trip, meta: { ...trip.meta, [k]: v } })

  const setDay = (i: number, d: DayRaw) => { const days = [...trip.days]; days[i] = d; setTrip({ ...trip, days }) }
  const delDay = (i: number) => {
    if (!confirm(`Delete Day ${trip.days[i].n}?`)) return
    const days = trip.days.filter((_, j) => j !== i).map((d, idx) => ({ ...d, n: idx + 1 }))
    setTrip({ ...trip, days })
  }
  const addDay = () => {
    const n = trip.days.length + 1
    setTrip({ ...trip, days: [...trip.days, { n, date: '', dow: '', en: '', iso: '', hero: '', title: '', intro: '', stops: [] }] })
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

  return (
    <div className="adm-root" dir="ltr">
      <div className="adm-topbar">
        <div className="adm-topbar-left">
          <button className="adm-btn adm-back" onClick={() => location.href = '/admin'}>← Trips</button>
          <h1>✏️ {tripId}</h1>
        </div>
        <span className="adm-saved">{saved ? '✓ saved' : ''}</span>
        <div className="adm-actions">
          <button className="adm-btn adm-save" onClick={saveToCloud} disabled={saving}>
            {saving ? '⏳ Saving…' : '☁️ Save'}
          </button>
          {saveErr && <span style={{ color: '#f87171', fontSize: 12 }}>{saveErr}</span>}
          <button className="adm-btn adm-preview" onClick={() => {
            localStorage.setItem(`preview-${tripId}`, JSON.stringify(toClean(trip)))
            window.open(`/trip/${tripId}?preview`, '_blank')
          }}>
            👁 Preview
          </button>
          <button className="adm-btn adm-preview" onClick={shareLink}>
            {shareMsg || '🔗 Copy link'}
          </button>
          <div className="adm-menu-wrap">
            <button className="adm-btn adm-more" onClick={() => setMenu((m) => !m)} aria-label="More">⋯</button>
            {menu && (
              <>
                <div className="adm-backdrop" onClick={() => setMenu(false)} />
                <div className="adm-menu">
                  <button onClick={() => { setMenu(false); resetDraft() }}>↺ Reset to published</button>
                  <label onClick={() => setMenu(false)}>
                    📂 Import trip.json
                    <input type="file" accept=".json" onChange={importFile} hidden />
                  </label>
                  <button onClick={() => { setMenu(false); exportJson() }}>⬇️ Export trip.json</button>
                  {hasFileApi && isLocal && (
                    <button onClick={() => { setMenu(false); linkFile() }}>
                      {fileHandle.current ? '🔗 Linked to file' : '🔗 Link to file (dev)'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="adm-body">
        <aside className="adm-nav">
          <div className="adm-nav-group">
            <button onClick={() => navTo('adm-cover')}>Cover & Details</button>
          </div>
          <div className="adm-nav-group">
            <div className="adm-nav-label">Days</div>
            {trip.days.map((d) => (
              <button key={d.n} onClick={() => navTo(`adm-day-${d.n}`)}>
                <span className="adm-nav-badge">{d.n}</span>
                <span className="adm-nav-day-title">{d.title || d.date || '…'}</span>
              </button>
            ))}
            <button className="adm-nav-add" onClick={addDay}>+ Add day</button>
          </div>
          <div className="adm-nav-group">
            <button onClick={() => navTo('adm-recs')}>Recommendations</button>
            <button onClick={() => navTo('adm-contact')}>Contact</button>
            <button onClick={() => navTo('adm-json')}>JSON Preview</button>
          </div>
        </aside>

        <div className="adm-main">
          <div id="adm-cover" className="adm-section">
            <h2>Trip cover & details</h2>
            <div className="adm-row3">
              <label>Title<input value={trip.meta.title} onChange={(e) => setMeta('title', e.target.value)} /></label>
              <label>Subtitle<input value={trip.meta.subtitle} onChange={(e) => setMeta('subtitle', e.target.value)} /></label>
              <label>Country<input value={trip.meta.country} onChange={(e) => setMeta('country', e.target.value)} /></label>
              <label>📅 Start date<input type="date" value={trip.meta.startISO} onChange={(e) => setMeta('startISO', e.target.value)} /></label>
              <label>📅 End date<input type="date" value={trip.meta.endISO} onChange={(e) => setMeta('endISO', e.target.value)} /></label>
              <label>Travellers line<input value={trip.meta.who} onChange={(e) => setMeta('who', e.target.value)} /></label>
              <label>App language
                <select value={trip.meta.lang ?? 'he'} onChange={(e) => setMeta('lang', e.target.value as 'he' | 'en')}>
                  <option value="he">🇮🇱 Hebrew (עברית)</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </label>
            </div>
            <PhotoField label="Cover photo" value={trip.meta.cover} onSet={(v) => setMeta('cover', v)} />
          </div>

          <div className="adm-section">
            <div className="adm-stops-hd">
              <h2>Days ({trip.days.length})</h2>
            </div>
            {trip.days.map((d, i) => (
              <DayEditor key={i} id={`adm-day-${d.n}`} day={d} onChange={(nd) => setDay(i, nd)} onDelete={() => delDay(i)} />
            ))}
          </div>

          <div id="adm-recs" className="adm-section">
            <h2>Recommendations</h2>
            <SpotSection title="⭐ Attractions (must-see)" list={trip.attractions} onChange={(l) => setTrip({ ...trip, attractions: l })} />
            <SpotSection title="📍 Places" list={trip.places} onChange={(l) => setTrip({ ...trip, places: l })} />
          </div>

          <div id="adm-contact" className="adm-section">
            <h2>Contact</h2>
            <div className="adm-row3">
              <label>Instagram<input value={trip.contact.instagram} onChange={(e) => setTrip({ ...trip, contact: { ...trip.contact, instagram: e.target.value } })} /></label>
              <label>Phone IL<input value={trip.contact.phoneIL} onChange={(e) => setTrip({ ...trip, contact: { ...trip.contact, phoneIL: e.target.value, phoneILraw: e.target.value.replace(/[^+\d]/g, '') } })} /></label>
              <label>Phone IT<input value={trip.contact.phoneIT} onChange={(e) => setTrip({ ...trip, contact: { ...trip.contact, phoneIT: e.target.value, phoneITraw: e.target.value.replace(/[^+\d]/g, '') } })} /></label>
            </div>
          </div>

          <div className="adm-hint">
            <b>☁️ Publish:</b> Click <b>Save</b> to push to GitHub, then <b>Copy link</b> to share with travelers.
          </div>

          <div id="adm-json"><JsonPreview trip={trip} /></div>
        </div>
      </div>
    </div>
  )
}

function JsonPreview({ trip }: { trip: TripRaw }) {
  const [open, setOpen] = useState(false)
  const json = JSON.stringify(toClean(trip), null, 2)
  const copy = () => navigator.clipboard.writeText(json)
  return (
    <div className="adm-json-preview">
      <button className="adm-json-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▲' : '▼'} JSON Preview
      </button>
      {open && (
        <div className="adm-json-body">
          <button className="adm-json-copy" onClick={copy}>Copy</button>
          <pre>{json}</pre>
        </div>
      )}
    </div>
  )
}
