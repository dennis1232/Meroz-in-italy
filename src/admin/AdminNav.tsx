import { type DayRaw } from '../tripUtils'

type Props = {
  days: DayRaw[]
  onNav: (id: string) => void
  onAddDay: () => void
}

export default function AdminNav({ days, onNav, onAddDay }: Props) {
  return (
    <aside className="adm-nav">
      <div className="adm-nav-group">
        <button onClick={() => onNav('adm-cover')}>Cover & Details</button>
      </div>
      <div className="adm-nav-group">
        <div className="adm-nav-label">Days</div>
        {days.map((d) => (
          <button key={d.n} onClick={() => onNav(`adm-day-${d.n}`)}>
            <span className="adm-nav-badge">{d.n}</span>
            <span className="adm-nav-day-title">{d.title || d.date || '…'}</span>
          </button>
        ))}
        <button className="adm-nav-add" onClick={onAddDay}>+ Add day</button>
      </div>
      <div className="adm-nav-group">
        <button onClick={() => onNav('adm-recs')}>Recommendations</button>
        <button onClick={() => onNav('adm-contact')}>Contact</button>
        <button onClick={() => onNav('adm-json')}>JSON Preview</button>
      </div>
    </aside>
  )
}
