import type { Stop } from '../../types'
import { t } from '../../i18n'
import { gmaps, waze, TAG_EMOJI, navForStop } from '../../ui'

export default function StopRow({ stops, i }: { stops: Stop[]; i: number }) {
  const s = stops[i]
  const { isDrive, icon, wazeTarget } = navForStop(stops, i)

  if (s.move) {
    return (
      <li className="move-leg">
        <span className="ml-icon">{icon ?? '🚗'}</span>
        <div className="ml-body">
          <span className="ml-name">{s.name}</span>
          {s.desc && <span className="ml-dur">{s.desc}</span>}
        </div>
        {isDrive && wazeTarget && (
          <a className="go waze ml-waze" href={waze(wazeTarget)}>Waze</a>
        )}
      </li>
    )
  }

  return (
    <li>
      <span className="dot" />
      <div className="body">
        <div className="nm">
          {s.tag && <span className="stop-tag">{TAG_EMOJI[s.tag]}</span>}
          {s.parking && <span className="stop-tag">🅿️</span>}
          <bdi className="nm-txt">{s.name}</bdi>
          {s.time && <span className="time">{s.time}</span>}
        </div>
        {s.desc && <div className="ds">{s.desc}</div>}
      </div>
      <div className="acts">
        {s.parking && (s.mapLink || s.lat != null) && (
          <a className="go waze park" href={s.mapLink || (s.lat != null ? waze({ lat: s.lat, lng: s.lng! }) : '#')}>{t('parkBtn')}</a>
        )}
        {!s.parking && (s.mapLink || s.lat != null) && (
          <a className="go" href={s.mapLink || gmaps(s)} target="_blank" rel="noopener">{t('mapBtn')}</a>
        )}
      </div>
    </li>
  )
}
