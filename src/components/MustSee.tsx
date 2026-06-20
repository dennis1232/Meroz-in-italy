import { attractions, places, type Spot } from '../data'
import { t } from '../i18n'
import { gmaps } from '../ui'

export default function MustSee() {
  return (
    <section className="screen active">
      <div className="mustsee">
        <div className="section-script">
          <span className="s">must see</span>
          <span className="h">ATTRACTIONS</span>
        </div>
        <div className="attr-grid">
          {attractions.map((a) => (
            <div className="attr" key={a.name}>
              <img src={a.img} alt={a.name} loading="lazy" />
              <div className="t">{a.name}</div>
              <div className="d">{a.desc}</div>
              <a className="pin" href={gmaps(a)} target="_blank" rel="noopener">{t('openInMap')}</a>
            </div>
          ))}
        </div>

        <div className="section-script">
          <span className="s">must see</span>
          <span className="h">PLACES</span>
        </div>
        <div className="places-grid">
          {places.map((p: Spot) => (
            <a className="place" key={p.name} href={gmaps(p)} target="_blank" rel="noopener">
              <img src={p.img} alt={p.name} loading="lazy" />
              <span className="cap">{p.name}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
