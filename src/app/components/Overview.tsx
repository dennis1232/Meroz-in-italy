import { days, meta } from '../../store'
import { A, ddmm } from '../../types'
import { deriveDow } from '../../tripUtils'
import { t, lang } from '../../i18n'
import { logo } from '../../ui'

export default function Overview({ goToDay }: { goToDay: (n: number) => void }) {
  const now = new Date()
  const start = new Date(meta.startISO)
  const end = new Date(meta.endISO)
  end.setDate(end.getDate() + 1)
  const total = days.length
  const dayN = now >= start && now < end
    ? Math.floor((now.getTime() - start.getTime()) / 86400000) + 1
    : null
  const daysLeft = now < start
    ? Math.ceil((start.getTime() - now.getTime()) / 86400000)
    : null

  return (
    <section className="screen active">
      <div className="cover" style={{ backgroundImage: `url(${A(meta.cover)})` }}>
        <img className="logo" src={logo} alt={meta.title} />
        <div className="dates" dir="ltr">{ddmm(meta.startISO)} – {ddmm(meta.endISO)}</div>
        <div className="who">{meta.who}</div>
      </div>
      {daysLeft !== null && (
        <div className="countdown">{t('countdownPre')} <b>{daysLeft}</b> {t('countdownPost')}</div>
      )}
      {dayN !== null && (
        <div className="countdown in-trip">🇮🇹 Day <b>{dayN}</b> / {total}</div>
      )}

      <div className="section-script">
        <span className="s">trip</span>
        <span className="h">OVERVIEW</span>
      </div>

      <div className="polaroids">
        {days.map((d) => (
          <button className="pola" key={d.n} onClick={() => goToDay(d.n)}>
            <img src={d.hero} alt={d.title} loading="lazy" />
            <div className="cap">{deriveDow(d.iso, d.dow, lang())}</div>
            <div className="cd">{d.date}</div>
          </button>
        ))}
      </div>
    </section>
  )
}
