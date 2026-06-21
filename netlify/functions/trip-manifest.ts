import type { Handler } from '@netlify/functions'

const ID_RE = /^[a-z0-9-]+$/

export const handler: Handler = async (event) => {
  const tripId = event.queryStringParameters?.tripId?.trim()
  if (!tripId || !ID_RE.test(tripId)) {
    return { statusCode: 400, body: 'Invalid tripId' }
  }

  let title = tripId
  let subtitle = ''
  let lang = 'he'

  const host = event.headers.host
  const proto = event.headers['x-forwarded-proto'] ?? 'https'
  const origin = host ? `${proto}://${host}` : ''

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

  const startUrl = `/trip/${tripId}`
  const shortName = title.length > 14 ? `${title.slice(0, 12)}…` : title
  const name = subtitle ? `${title} · ${subtitle}` : title

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=300',
    },
    body: JSON.stringify({
      id: startUrl,
      name,
      short_name: shortName,
      description: subtitle || title,
      start_url: startUrl,
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      theme_color: '#9c3b2e',
      background_color: '#f3ecdf',
      lang,
      dir: lang === 'en' ? 'ltr' : 'rtl',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    }),
  }
}
