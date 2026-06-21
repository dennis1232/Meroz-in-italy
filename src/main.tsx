import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Admin from './admin/Admin'
import AdminHome from './admin/AdminHome'
import NotFound from './components/NotFound'
import { loadTrip, initTrip, meta } from './data'
import { applyTripPwa, redirectStandaloneToSavedTrip, setTripManifestLink } from './pwaManifest'

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

function showNotFound() {
  root.render(<React.StrictMode><NotFound /></React.StrictMode>)
}

// Only /trip/{id} is a valid traveler route — never redirect to another trip
if (segments[0] === 'trips' || segments[0] === 'trip' && segments.length < 2) {
  showNotFound()

} else if (segments[0] === 'admin' && segments.length === 1) {
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
  setTripManifestLink(tripId)
  const isPreview = new URLSearchParams(location.search).has('preview')
  const previewRaw = isPreview ? localStorage.getItem(`preview-${tripId}`) : null

  if (isPreview && previewRaw) {
    try {
      initTrip(JSON.parse(previewRaw))
      applyTripPwa(tripId, meta)
      root.render(<React.StrictMode><App /></React.StrictMode>)
    } catch {
      showNotFound()
    }
  } else {
    loadTrip(tripId)
      .then(() => {
        applyTripPwa(tripId, meta)
        root.render(<React.StrictMode><App /></React.StrictMode>)
      })
      .catch(() => showNotFound())
  }

} else {
  if (!redirectStandaloneToSavedTrip()) showNotFound()
}
