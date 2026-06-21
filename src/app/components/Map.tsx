import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useMemo } from 'react'
import type { Stop } from '../../types'

const gmaps = (s: Stop) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name + ' Italy')}`

const waze = (s: Stop) => `waze://?ll=${s.lat},${s.lng}&navigate=yes`

const numIcon = (n: number, color = '#9c3b2e') =>
  L.divIcon({
    className: '',
    html: `<div class="pin-num" style="background:${color}">${n}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14]
  })

function Fit({ pts }: { pts: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    // container may mount at the wrong size (flex/tab switch) — force recalc
    const fit = () => {
      map.invalidateSize()
      if (!pts.length) return
      if (pts.length === 1) map.setView(pts[0], 13)
      else map.fitBounds(L.latLngBounds(pts), { padding: [30, 30] })
    }
    const t = setTimeout(fit, 60)
    requestAnimationFrame(fit)
    window.addEventListener('resize', fit)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', fit)
    }
  }, [pts, map])
  return null
}

export default function Map({
  stops,
  route = false,
  color = '#9c3b2e'
}: {
  stops: Stop[]
  route?: boolean
  color?: string
}) {
  const pinned = useMemo(() => stops.filter((s) => s.lat != null), [stops])
  const pts = useMemo(() => pinned.map((s) => [s.lat!, s.lng!] as [number, number]), [pinned])

  return (
    <MapContainer center={[43.3, 11.3]} zoom={8} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <Fit pts={pts} />
      {route && pts.length > 1 && (
        <Polyline positions={pts} pathOptions={{ color, weight: 3, opacity: 0.6, dashArray: '6 8' }} />
      )}
      {pinned.map((s, i) => (
        <Marker key={i} position={[s.lat!, s.lng!]} icon={numIcon(i + 1, color)}>
          <Popup>
            <div className="pp-name">{s.name}</div>
            {s.desc && <div className="pp-desc">{s.desc}</div>}
            <div className="pp-btns">
              {s.parking
                ? <a className="gp gp-waze" href={waze(s)}>🅿️ להחנות פה</a>
                : <a className="gp" href={gmaps(s)} target="_blank" rel="noopener">📍 Google Maps ↗</a>
              }
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
