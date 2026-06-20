export function fileToDataUrl(file: File, maxW = 1400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxW / img.width)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')
      if (!ctx) return reject(new Error('no canvas ctx'))
      ctx.drawImage(img, 0, 0, w, h)
      resolve(c.toDataURL('image/webp', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

export async function expandShortUrl(url: string): Promise<string> {
  const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
  if (!res.ok) throw new Error('proxy error')
  const json = await res.json()
  return (json.status?.url as string | undefined) ?? url
}

export function isWazeLink(url: string): boolean {
  return /waze\.com|waze:\/\//i.test(url)
}

export function linkForCoords(lat: string, lng: string, source: string): string {
  if (/waze\.com/i.test(source)) {
    return `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`
  }
  return `https://www.google.com/maps?q=${lat},${lng}`
}
