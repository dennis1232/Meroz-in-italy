import { useState } from 'react'
import { isoToFields, type DayRaw, type StopRaw } from '../tripUtils'
import PhotoField from './fields/PhotoField'
import StopRow from './StopRow'

type Props = {
  day: DayRaw
  onChange: (d: DayRaw) => void
  onDelete: () => void
  id?: string
}

export default function DayEditor({ day, onChange, onDelete, id }: Props) {
  const [open, setOpen] = useState(false)
  const [quickName, setQuickName] = useState('')
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
  const addStop = (name = 'New stop') => set('stops', [...day.stops, { name }])

  const quickAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && quickName.trim()) {
      addStop(quickName.trim())
      setQuickName('')
    }
  }

  return (
    <div className="adm-day" id={id}>
      <div className="adm-day-hd" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <b>Day {day.n}</b>
        <span className="adm-day-title">{day.dow} · {day.date} — {day.title}</span>
        <button className="adm-del" aria-label="Delete day" onClick={(e) => { e.stopPropagation(); onDelete() }}>✕</button>
        <span aria-hidden="true">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="adm-day-body">
          <div className="adm-row2">
            <label>
              📅 Date
              <input type="date" value={day.iso || ''} onChange={(e) => setDate(e.target.value)} />
            </label>
            <div className="adm-derived">
              {day.iso ? <>→ {day.date} · {day.dow} · {day.en}</> : 'pick a date'}
            </div>
          </div>
          <label>
            Title (banner)
            <input value={day.title} onChange={(e) => set('title', e.target.value)} />
          </label>
          <label>
            Intro
            <textarea value={day.intro} onChange={(e) => set('intro', e.target.value)} />
          </label>
          <div className="adm-stop-media">
            <PhotoField label="Hero photo" value={day.hero} onSet={(v) => set('hero', v)} />
          </div>

          <div className="adm-stops-hd">
            <b>Stops ({day.stops.length})</b>
            <button className="adm-add" onClick={() => addStop()}>+ Add stop</button>
          </div>
          {day.stops.map((s, i) => (
            <StopRow key={i} stop={s} onChange={(ns) => setStop(i, ns)} onDelete={() => delStop(i)} onMove={(dir) => moveStop(i, dir)} />
          ))}
          <input
            className="adm-quick-add"
            placeholder="Add stop name…"
            value={quickName}
            onChange={e => setQuickName(e.target.value)}
            onKeyDown={quickAdd}
          />
        </div>
      )}
    </div>
  )
}
