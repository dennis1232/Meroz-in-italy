import type { Handler } from '@netlify/functions'

const ID_RE = /^[a-z0-9-]+$/

function buildManifest(tripId: string, origin: string, title: string, subtitle: string, lang: string) {
  const startUrl = `${origin}/trip/${tripId}`
  const shortName = title.length > 14 ? `${title.slice(0, 12)}…` : title
  const name = subtitle ? `${title} · ${subtitle}` : title

  return {
    id: startUrl,
    name,
    short_name: shortName,
    description: subtitle || title,
    start_url: startUrl,
    scope: `${origin}/`,
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#9c3b2e',
    background_color: '#f3ecdf',
    lang,
    dir: lang === 'en' ? 'ltr' : 'rtl',
    icons: [
      { src: `${origin}/icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${origin}/icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
      { src: `${origin}/icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  }
}

export const handler: Handler = async (event) => {
  const tripId = event.queryStringParameters?.tripId?.trim()
  if (!tripId || !ID_RE.test(tripId)) {
    return { statusCode: 400, body: 'Invalid tripId' }
  }

  const host = event.headers.host
  const proto = event.headers['x-forwarded-proto'] ?? 'https'
  const origin = host ? `${proto}://${host}` : ''

  let title = tripId
  let subtitle = ''
  let lang = 'he'

  if (origin) {
    try {
      const res = await fetch(`${origin}/trips/${tripId}.json`, { cache: 'no-cache' })
      if (res.ok) {
        const data = await res.json()
        title = data.meta?.title?.trim() || tripId
        subtitle = data.meta?.subtitle?.trim() || ''
        lang = data.meta?.lang === 'en' ? 'en' : 'he'
      }
    } catch { /* use defaults */ }
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=300',
    },
    body: JSON.stringify(buildManifest(tripId, origin || `https://${host}`, title, subtitle, lang)),
  }
}
