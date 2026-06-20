// Cloudinary: prefer .env (VITE_*), fallback to localStorage from AdminHome settings
export type CloudConfig = {
  cloudinaryCloud: string   // e.g. "my-cloud"
  cloudinaryPreset: string  // unsigned upload preset name
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
  try { return JSON.parse(localStorage.getItem(KEY) ?? 'null') } catch { return null }
}

export function isCloudinaryFromEnv(): boolean {
  return envConfig() !== null
}

export function getConfig(): CloudConfig | null {
  return envConfig() ?? localConfig()
}

export function saveConfig(cfg: CloudConfig) {
  localStorage.setItem(KEY, JSON.stringify(cfg))
}

// Upload image file to Cloudinary, return secure URL
export async function uploadImage(file: File): Promise<string> {
  const cfg = getConfig()
  if (!cfg?.cloudinaryCloud || !cfg?.cloudinaryPreset) {
    throw new Error('Cloudinary not configured — set VITE_CLOUDINARY_* in .env or open Settings in admin home')
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
    throw new Error(msg ? `Cloudinary: ${msg}` : `Cloudinary upload failed: ${res.status}`)
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
