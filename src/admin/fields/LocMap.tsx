import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'

export default function LocMap({ lat, lng }: { lat: number; lng: number }) {
  const pos: [number, number] = [lat, lng]

  function Center() {
    const map = useMap()
    useEffect(() => {
      map.setView([lat, lng], 15)
      const t = setTimeout(() => map.invalidateSize(), 60)
      return () => clearTimeout(t)
    }, [lat, lng, map])
    return null
  }

  return (
    <MapContainer center={pos} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
      <Center />
      <Marker position={pos} />
    </MapContainer>
  )
}
