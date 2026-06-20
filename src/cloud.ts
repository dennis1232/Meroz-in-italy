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

/** Saved browser settings win over .env — avoids .env example values overriding a working preset. */
export function getCloudConfig(): CloudConfig | null {
  return localConfig() ?? envConfig()
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
  return json.secure_url as string
}

// Save trip JSON to GitHub via Netlify function
export async function saveTrip(tripId: string, tripData: unknown): Promise<void> {
  const res = await fetch('/.netlify/functions/save-trip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tripId, tripData }),
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`Save failed: ${msg}`)
  }
}

type ManageTripBody =
  | { action: 'rename'; tripId: string; title: string }
  | { action: 'delete'; tripId: string }
  | { action: 'duplicate'; tripId: string; newTripId: string; title?: string; tripData?: unknown }

export async function manageTrip(body: ManageTripBody): Promise<{ newTripId?: string; title?: string; tripData?: unknown }> {
  const res = await fetch('/.netlify/functions/trip-manage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg)
  }
  return res.json()
}
