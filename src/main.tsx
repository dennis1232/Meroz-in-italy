import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

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


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
