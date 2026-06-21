import { useState } from 'react'
import { parseLatLng } from '../../tripUtils'
import { expandShortUrl, isWazeLink, linkForCoords } from '../utils'
import LocMap from './LocMap'

type Props = {
  lat?: string
  lng?: string
  mapLink?: string
  onSet: (lat: string, lng: string, mapLink?: string) => void
}

export default function LocationField({ lat, lng, mapLink, onSet }: Props) {
  const [paste, setPaste] = useState('')
  const [err, setErr] = useState(false)
  const [expanding, setExpanding] = useState(false)

  const displayUrl = mapLink || (lat && lng ? linkForCoords(lat, lng, '') : '')
  const inputValue = paste || displayUrl

  const apply = async (v: string) => {
    setPaste(v)
    setErr(false)
    if (!v.trim()) {
      onSet('', '', '')
      return
    }
    let target = v.trim()
    if (/maps\.app\.goo\.gl/.test(target)) {
      setExpanding(true)
      try { target = await expandShortUrl(target) }
      catch { setErr(true); setExpanding(false); return }
      setExpanding(false)
    }
    const r = parseLatLng(target)
    if (r) {
      const storedLink = /^(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/.test(v.trim())
        ? linkForCoords(r.lat, r.lng, v)
        : (/maps\.app\.goo\.gl/.test(v.trim()) ? target : v.trim())
      onSet(r.lat, r.lng, storedLink)
      setErr(false)
      setPaste('')
    } else setErr(true)
  }

  const clear = () => {
    setPaste('')
    setErr(false)
    onSet('', '', '')
  }

  return (
    <div className="adm-loc">
      <label>
        📍 Paste Google Maps / Waze link
        <input
          value={inputValue}
          placeholder="https://maps.app.goo.gl/...  or  43.77, 11.26"
          onChange={(e) => apply(e.target.value)}
        />
      </label>
      {expanding && <div className="adm-loc-no">⏳ extracting coordinates…</div>}
      {!expanding && lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng)) ? (
        <div className="adm-loc-map">
          <span className={`adm-loc-badge ${isWazeLink(displayUrl) ? 'adm-loc-badge-waze' : ''}`}>
            {isWazeLink(displayUrl) ? 'Waze' : 'Google Maps'}
          </span>
          <button type="button" className="adm-loc-clear" onClick={clear}>clear</button>
          <LocMap lat={parseFloat(lat)} lng={parseFloat(lng)} />
        </div>
      ) : (
        !expanding && <div className="adm-loc-no">{err ? '⚠️ no coordinates found in that link' : 'no location set'}</div>
      )}
    </div>
  )
}
