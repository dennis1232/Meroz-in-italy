import { useState } from 'react'
import { type SpotRaw } from '../tripUtils'
import LocationField from './fields/LocationField'
import PhotoField from './fields/PhotoField'

type Props = {
  spot: SpotRaw
  onChange: (s: SpotRaw) => void
  onDelete: () => void
  onMove: (dir: -1 | 1) => void
}

export default function SpotRow({ spot, onChange, onDelete, onMove }: Props) {
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
          <label>Name<input value={spot.name} onChange={(e) => set('name', e.target.value)} /></label>
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
