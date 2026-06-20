// Cloudinary upload (optional — set VITE_CLOUDINARY_* in env)
export async function uploadImage(file: File): Promise<string> {
  const cloud = (import.meta.env.VITE_CLOUDINARY_CLOUD ?? '').trim()
  const preset = (import.meta.env.VITE_CLOUDINARY_PRESET ?? '').trim()
  if (!cloud || !preset) {
    throw new Error('Image upload is not available')
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

type ManageTripBody =
  | { action: 'rename'; tripId: string; title: string }
  | { action: 'delete'; tripId: string }
  | { action: 'duplicate'; tripId: string; newTripId: string; title?: string }

export async function manageTrip(body: ManageTripBody): Promise<{ newTripId?: string; title?: string }> {
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
