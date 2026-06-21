import { useState } from 'react'
import type { Day } from '../../types'
import { isoToFields, deriveDow } from '../../tripUtils'
import { t, lang } from '../../i18n'
import Map from './Map'
import { colorFor } from '../../ui'
import StopRow from './StopRow'

export default function DayCard({ d, defaultOpen, isToday }: { d: Day; defaultOpen: boolean; isToday?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const color = colorFor(d.n)
  const dow = deriveDow(d.iso, d.dow, lang())
  const en = lang() === 'en' && d.iso ? isoToFields(d.iso).en : d.en
  return (
    <article id={`day-${d.n}`} className={'daycard' + (open ? ' open' : '')}>
      <div className="hero" onClick={() => setOpen((o) => !o)}>
        <img src={d.hero} alt={d.title} loading="lazy" />
        <div className="scrim" />
        <div className="badge">
          <small>DAY</small>
          <b>{d.n}</b>
          {isToday && <span className="today-badge">TODAY</span>}
        </div>
        <div className="meta">
          <div className="dow">{dow}</div>
          <div className="en">{en}</div>
        </div>
      </div>

      <div className="banner">{d.title}</div>
      {d.intro && <div className="intro">{d.intro}</div>}

      <div className="daybody">
        <ul className="stops">
          {d.stops.map((_, i) => (
            <StopRow key={i} stops={d.stops} i={i} />
          ))}
        </ul>

        {open && d.stops.some((s) => s.lat != null) && (
          <div className="daymap">
            <Map stops={d.stops} route color={color} />
          </div>
        )}
      </div>

      <div className="expander" onClick={() => setOpen((o) => !o)}>
        {open ? t('closeDay') : t('openDay')} <span className="chev">▾</span>
      </div>
    </article>
  )
}
