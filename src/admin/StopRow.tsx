import { useState } from 'react'
import { TAGS, TAG_LABEL, type StopRaw } from '../tripUtils'
import LocationField from './fields/LocationField'

type Props = {
  stop: StopRaw
  onChange: (s: StopRaw) => void
  onDelete: () => void
  onMove: (dir: -1 | 1) => void
}

export default function StopRow({ stop, onChange, onDelete, onMove }: Props) {
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
