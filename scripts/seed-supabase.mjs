import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
const tripsDir = join(__dir, '../public/trips')

const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${key}`,
  'apikey': key,
  'Prefer': 'resolution=merge-duplicates',
}

const files = await readdir(tripsDir)
const tripFiles = files.filter(f => f !== 'index.json' && f.endsWith('.json'))

console.log(`Seeding ${tripFiles.length} trips...`)

for (const f of tripFiles) {
  const id = f.replace(/\.json$/, '')
  const data = JSON.parse(await readFile(join(tripsDir, f), 'utf8'))
  const res = await fetch(`${url}/rest/v1/trips`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id, data }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error(`❌ ${id}:`, err)
  } else {
    console.log(`✅ ${id}`)
  }
}

console.log('Done.')
