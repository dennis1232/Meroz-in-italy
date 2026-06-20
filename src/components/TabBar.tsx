import type { Tab } from '../ui'
import { t } from '../i18n'

const TABS: { id: Tab; ic: string; key: 'tabHome' | 'tabTrip' | 'tabMap' | 'tabSee' | 'tabMore' }[] = [
  { id: 'home', ic: '🏠', key: 'tabHome' },
  { id: 'trip', ic: '📅', key: 'tabTrip' },
  { id: 'map',  ic: '🗺️', key: 'tabMap' },
  { id: 'see',  ic: '⭐', key: 'tabSee' },
  { id: 'more', ic: 'ℹ️', key: 'tabMore' },
]

export default function TabBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav className="tabbar">
      {TABS.map((tb) => (
        <button key={tb.id} className={tab === tb.id ? 'on' : ''} onClick={() => onTab(tb.id)}>
          <span className="ic">{tb.ic}</span>
          <span>{t(tb.key)}</span>
        </button>
      ))}
    </nav>
  )
}
