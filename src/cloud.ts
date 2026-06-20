function readFileBase64(file: File): Promise<{ data: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const comma = result.indexOf(',')
      resolve({
        data: comma >= 0 ? result.slice(comma + 1) : result,
        mime: file.type || 'image/jpeg',
      })
    }
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

// Upload via Netlify function — reads CLOUDINARY_* from env at request time
export async function uploadImage(file: File): Promise<string> {
  const { data, mime } = await readFileBase64(file)
  const res = await fetch('/.netlify/functions/upload-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, mime }),
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || `Upload failed: ${res.status}`)
  }
  const json = await res.json()
  return json.url as string
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
