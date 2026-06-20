import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Admin from './admin/Admin'
import AdminHome from './admin/AdminHome'
import { loadTrip, initTrip } from './data'

// bundled fonts (work offline)
import '@fontsource/playfair-display/400.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/playfair-display/900.css'
import '@fontsource/dancing-script/600.css'
import '@fontsource/heebo/300.css'
import '@fontsource/heebo/400.css'
import '@fontsource/heebo/700.css'

import 'leaflet/dist/leaflet.css'
import './styles.css'

const root = ReactDOM.createRoot(document.getElementById('root')!)
const segments = location.pathname.replace(/\/$/, '').split('/').filter(Boolean)

if (segments[0] === 'admin' && segments.length === 1) {
  root.render(<React.StrictMode><AdminHome /></React.StrictMode>)

} else if (segments[0] === 'admin' && segments.length >= 2) {
  const tripId = segments[1]
  const hasDraft = !!localStorage.getItem(`draft-${tripId}`)
  const boot = hasDraft
    ? Promise.resolve()
    : loadTrip(tripId).catch(err => console.error(`Failed to load trips/${tripId}.json`, err))
  boot.finally(() => root.render(<React.StrictMode><Admin tripId={tripId} /></React.StrictMode>))

} else if (segments[0] === 'trip' && segments.length >= 2) {
  const tripId = segments[1]
  const isPreview = new URLSearchParams(location.search).has('preview')
  const previewData = isPreview ? localStorage.getItem(`preview-${tripId}`) : null
  const boot = previewData
    ? Promise.resolve(initTrip(JSON.parse(previewData)))
    : loadTrip(tripId).catch(err => console.error(`Failed to load trips/${tripId}.json`, err))
  boot.finally(() => root.render(<React.StrictMode><App /></React.StrictMode>))

} else if (segments.length === 0) {
  fetch(`${import.meta.env.BASE_URL}trips/index.json`)
    .then(r => r.json())
    .then((trips: { id: string }[]) => {
      if (trips[0]?.id) location.replace(`/trip/${trips[0].id}`)
    })
    .catch(() => {})
  root.render(
    <React.StrictMode>
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>Loading trip…</div>
    </React.StrictMode>
  )

} else {
  root.render(
    <React.StrictMode>
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        Page not found. Try{' '}
        <a href="/trip/meroz-italy-2026">/trip/meroz-italy-2026</a> or{' '}
        <a href="/admin">/admin</a>.
      </div>
    </React.StrictMode>
  )
}
