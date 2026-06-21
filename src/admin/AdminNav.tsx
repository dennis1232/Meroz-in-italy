import { type DayRaw } from '../tripUtils'

type Props = {
  days: DayRaw[]
  activeId: string
  onNav: (id: string) => void
  onAddDay: () => void
}

export default function AdminNav({ days, activeId, onNav, onAddDay }: Props) {
  return (
    <aside className="adm-nav">
      <div className="adm-nav-group">
        <button className={activeId === 'adm-cover' ? 'adm-nav-active' : ''} onClick={() => onNav('adm-cover')}>Cover & Details</button>
      </div>
      <div className="adm-nav-group">
        <div className="adm-nav-label">Days</div>
        {days.map((d) => (
          <button
            key={d.n}
            className={activeId === `adm-day-${d.n}` ? 'adm-nav-active' : ''}
            onClick={() => onNav(`adm-day-${d.n}`)}
          >
            <span className="adm-nav-badge">{d.n}</span>
            <span className="adm-nav-day-title">{d.title || d.date || '…'}</span>
          </button>
        ))}
        <button className="adm-nav-add" onClick={onAddDay}>+ Add day</button>
      </div>
      <div className="adm-nav-group">
        <button className={activeId === 'adm-recs' ? 'adm-nav-active' : ''} onClick={() => onNav('adm-recs')}>Recommendations</button>
        <button className={activeId === 'adm-contact' ? 'adm-nav-active' : ''} onClick={() => onNav('adm-contact')}>Contact</button>
      </div>
    </aside>
  )
}
