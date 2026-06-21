import { useEffect, useMemo, useRef } from 'react'
import { days } from '../../store'
import { ddmm } from '../../types'
import { t } from '../../i18n'
import Topbar from './Topbar'
import DayCard from './DayCard'

export default function Itinerary({ targetDay }: { targetDay: number | null }) {
  const listRef = useRef<HTMLDivElement>(null)
  const todayStr = useMemo(() => ddmm(new Date().toISOString().slice(0, 10)), [])

  useEffect(() => {
    if (targetDay == null) return
    // wait for the card to open & render, then scroll it under the sticky topbar
    const t = setTimeout(() => {
      const el = document.getElementById(`day-${targetDay}`)
      if (!el) return
      const topbarH = (document.querySelector('.topbar') as HTMLElement)?.offsetHeight ?? 70
      const y = el.getBoundingClientRect().top + window.scrollY - topbarH - 8
      window.scrollTo({ top: Math.max(0, y) })
    }, 120)
    return () => clearTimeout(t)
  }, [targetDay])

  return (
    <section className="screen active">
      <Topbar title={t('itineraryTitle')} sub={t('itinerarySub')} />
      <div className="daylist" ref={listRef}>
        {days.map((d) => (
          <DayCard
            key={d.n}
            d={d}
            defaultOpen={targetDay != null ? d.n === targetDay : d.n === 1}
            isToday={d.date === todayStr}
          />
        ))}
      </div>
    </section>
  )
}
