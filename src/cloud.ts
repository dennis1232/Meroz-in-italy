// Cloudinary — configured via VITE_CLOUDINARY_* env vars (Netlify / .env)
export function isCloudinaryConfigured(): boolean {
  const cloud = (import.meta.env.VITE_CLOUDINARY_CLOUD ?? '').trim()
  const preset = (import.meta.env.VITE_CLOUDINARY_PRESET ?? '').trim()
  return !!(cloud && preset)
}

export async function uploadImage(file: File): Promise<string> {
  const cloud = (import.meta.env.VITE_CLOUDINARY_CLOUD ?? '').trim()
  const preset = (import.meta.env.VITE_CLOUDINARY_PRESET ?? '').trim()
  if (!cloud || !preset) {
    throw new Error('Cloudinary not configured — set VITE_CLOUDINARY_CLOUD and VITE_CLOUDINARY_PRESET in Netlify env vars')
  }
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', preset)
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
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
