import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { loadTrip } from './data'

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

// Load trip data at runtime so the same built shell can be reused with a
// different trip.json (no rebuild) — the trip-factory workflow.
loadTrip()
  .catch((err) => {
    console.error('Failed to load trip.json', err)
  })
  .finally(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  })
