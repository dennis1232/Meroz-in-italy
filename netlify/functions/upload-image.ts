import type { Handler } from '@netlify/functions'

function cloudConfig() {
  const cloud = (process.env['CLOUDINARY_CLOUD'] ?? process.env['VITE_CLOUDINARY_CLOUD'] ?? '').trim()
  const preset = (process.env['CLOUDINARY_PRESET'] ?? process.env['VITE_CLOUDINARY_PRESET'] ?? '').trim()
  if (!cloud || !preset) {
    throw new Error('Missing Cloudinary env — set CLOUDINARY_CLOUD + CLOUDINARY_PRESET (or VITE_CLOUDINARY_* ) in Netlify / .env')
  }
  return { cloud, preset }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  let data: string, mime: string
  try {
    ;({ data, mime } = JSON.parse(event.body ?? '{}'))
    if (!data) throw new Error('missing data')
    mime = mime || 'image/jpeg'
  } catch (e) {
    return { statusCode: 400, body: String(e) }
  }

  let cloud: string, preset: string
  try {
    ;({ cloud, preset } = cloudConfig())
  } catch (e) {
    return { statusCode: 503, body: String(e) }
  }

  try {
    const fd = new FormData()
    fd.append('file', `data:${mime};base64,${data}`)
    fd.append('upload_preset', preset)

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
      method: 'POST',
      body: fd,
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = (json as { error?: { message?: string } }).error?.message
      return {
        statusCode: res.status,
        body: msg ? `Cloudinary: ${msg}` : `Cloudinary upload failed: ${res.status}`,
      }
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, url: json.secure_url }),
    }
  } catch (e) {
    console.error(e)
    return { statusCode: 500, body: String(e) }
  }
}
