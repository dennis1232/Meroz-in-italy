import { useState } from 'react'
import { type SpotRaw } from '../tripUtils'
import SpotRow from './SpotRow'

type Props = { title: string; list: SpotRaw[]; onChange: (l: SpotRaw[]) => void }

export default function SpotSection({ title, list, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const setOne = (i: number, s: SpotRaw) => { const a = [...list]; a[i] = s; onChange(a) }
  const del = (i: number) => onChange(list.filter((_, j) => j !== i))
  const move = (i: number, dir: -1 | 1) => {
    const a = [...list]; const j = i + dir
    if (j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]; onChange(a)
  }
  const add = () => onChange([...list, { name: 'New', desc: '', img: '', lat: '', lng: '' }])

  return (
    <div className="adm-day">
      <div className="adm-day-hd" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <b>{title}</b>
        <span className="adm-day-title">{list.length} item{list.length !== 1 ? 's' : ''}</span>
        <span>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="adm-day-body">
          <div className="adm-stops-hd">
            <b>{list.length} item{list.length !== 1 ? 's' : ''}</b>
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
