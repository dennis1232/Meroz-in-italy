// Cloudinary — browser localStorage settings override .env (same as before Settings UI was removed)
export type CloudConfig = {
  cloudinaryCloud: string
  cloudinaryPreset: string
}

const KEY = 'meroz-cloud-config'

function envConfig(): CloudConfig | null {
  const cloudinaryCloud = (import.meta.env.VITE_CLOUDINARY_CLOUD ?? '').trim()
  const cloudinaryPreset = (import.meta.env.VITE_CLOUDINARY_PRESET ?? '').trim()
  if (cloudinaryCloud && cloudinaryPreset) {
    return { cloudinaryCloud, cloudinaryPreset }
  }
  return null
}

function localConfig(): CloudConfig | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const cfg = JSON.parse(raw) as CloudConfig
    if (cfg.cloudinaryCloud?.trim() && cfg.cloudinaryPreset?.trim()) {
      return {
        cloudinaryCloud: cfg.cloudinaryCloud.trim(),
        cloudinaryPreset: cfg.cloudinaryPreset.trim(),
      }
    }
  } catch { /* ignore */ }
  return null
}

/** .env wins when set; localStorage is fallback only. */
export function getCloudConfig(): CloudConfig | null {
  return envConfig() ?? localConfig()
}

export async function uploadImage(file: File): Promise<string> {
  const cfg = getCloudConfig()
  if (!cfg) {
    throw new Error('Missing Cloudinary env')
  }
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', cfg.cloudinaryPreset)
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cfg.cloudinaryCloud}/image/upload`,
    { method: 'POST', body: fd }
  )
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = (json as { error?: { message?: string } }).error?.message
    const detail = msg === 'Upload preset not found'
      ? ` (cloud: ${cfg.cloudinaryCloud}, preset: ${cfg.cloudinaryPreset})`
      : ''
    throw new Error(msg ? `Cloudinary: ${msg}${detail}` : `Cloudinary upload failed: ${res.status}`)
  }
  if (!json.secure_url) throw new Error('Cloudinary response missing secure_url')
  return json.secure_url as string
}

function sbHeaders() {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  return { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` }
}

function sbUrl(path: string) {
  return `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${path}`
}

export async function saveTrip(tripId: string, tripData: unknown): Promise<void> {
  if (import.meta.env.VITE_USE_SUPABASE === 'true') {
    const res = await fetch(sbUrl('trips'), {
      method: 'POST',
      headers: { ...sbHeaders(), Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ id: tripId, data: tripData }),
    })
    if (!res.ok) throw new Error(`Save failed: ${await res.text()}`)
  } else {
    const res = await fetch('/.netlify/functions/save-trip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId, tripData }),
    })
    if (!res.ok) throw new Error(`Save failed: ${await res.text()}`)
  }
}

type ManageTripBody =
  | { action: 'rename'; tripId: string; title: string }
  | { action: 'delete'; tripId: string }
  | { action: 'duplicate'; tripId: string; newTripId: string; title?: string; tripData?: unknown }

export async function manageTrip(body: ManageTripBody): Promise<{ newTripId?: string; title?: string; tripData?: unknown }> {
  if (import.meta.env.VITE_USE_SUPABASE === 'true') {
    if (body.action === 'delete') {
      const res = await fetch(sbUrl(`trips?id=eq.${encodeURIComponent(body.tripId)}`), {
        method: 'DELETE', headers: sbHeaders(),
      })
      if (!res.ok) throw new Error(await res.text())
      return {}
    }
    if (body.action === 'rename') {
      const get = await fetch(sbUrl(`trips?id=eq.${encodeURIComponent(body.tripId)}&select=data`), { headers: sbHeaders() })
      const [row] = await get.json()
      const next = { ...row.data, meta: { ...row.data.meta, title: body.title } }
      const res = await fetch(sbUrl(`trips?id=eq.${encodeURIComponent(body.tripId)}`), {
        method: 'PATCH', headers: sbHeaders(), body: JSON.stringify({ data: next }),
      })
      if (!res.ok) throw new Error(await res.text())
      return { title: body.title }
    }
    if (body.action === 'duplicate') {
      const src = await fetch(sbUrl(`trips?id=eq.${encodeURIComponent(body.tripId)}&select=data`), { headers: sbHeaders() })
      const [row] = await src.json()
      const data = { ...row.data, meta: { ...row.data.meta, title: body.title ?? row.data.meta.title } }
      const res = await fetch(sbUrl('trips'), {
        method: 'POST',
        headers: { ...sbHeaders(), Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ id: body.newTripId, data }),
      })
      if (!res.ok) throw new Error(await res.text())
      return { newTripId: body.newTripId, title: data.meta.title, tripData: data }
    }
  }
  const res = await fetch('/.netlify/functions/trip-manage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
