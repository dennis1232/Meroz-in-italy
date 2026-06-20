import type { Handler } from '@netlify/functions'

const API = 'https://api.github.com'

type GhConfig = { token: string; owner: string; repo: string }
type IndexEntry = { id: string; title: string; startISO: string; endISO: string }

function githubConfig(): GhConfig {
  const token = process.env['GITHUB_TOKEN']
  const owner = process.env['GITHUB_OWNER']
  const repo = process.env['GITHUB_REPO']
  if (!token || !owner || !repo) {
    throw new Error('Missing GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO in environment')
  }
  return { token, owner, repo }
}

const ghHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
})

async function ghGet(cfg: GhConfig, path: string) {
  const res = await fetch(`${API}${path}`, { headers: ghHeaders(cfg.token) })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub GET ${path} → ${res.status}`)
  return res.json()
}

async function ghPut(cfg: GhConfig, path: string, content: string, message: string, sha?: string) {
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content).toString('base64'),
  }
  if (sha) body.sha = sha
  const res = await fetch(`${API}${path}`, {
    method: 'PUT',
    headers: { ...ghHeaders(cfg.token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GitHub PUT ${path} → ${res.status}: ${err}`)
  }
  return res.json()
}

async function ghDelete(cfg: GhConfig, path: string, message: string, sha: string) {
  const res = await fetch(`${API}${path}`, {
    method: 'DELETE',
    headers: { ...ghHeaders(cfg.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GitHub DELETE ${path} → ${res.status}: ${err}`)
  }
}

function repoBase(cfg: GhConfig) {
  return `/repos/${cfg.owner}/${cfg.repo}/contents`
}

function tripPath(cfg: GhConfig, tripId: string) {
  return `${repoBase(cfg)}/public/trips/${tripId}.json`
}

function indexPath(cfg: GhConfig) {
  return `${repoBase(cfg)}/public/trips/index.json`
}

async function loadIndex(cfg: GhConfig) {
  const file = await ghGet(cfg, indexPath(cfg))
  const list: IndexEntry[] = file
    ? JSON.parse(Buffer.from(file.content, 'base64').toString())
    : []
  return { list, sha: file?.sha as string | undefined }
}

async function saveIndex(cfg: GhConfig, list: IndexEntry[], sha: string | undefined, message: string) {
  await ghPut(cfg, indexPath(cfg), JSON.stringify(list, null, 2), message, sha)
}

async function loadTripJson(cfg: GhConfig, tripId: string) {
  const file = await ghGet(cfg, tripPath(cfg, tripId))
  if (!file) throw new Error(`Trip not found: ${tripId}`)
  const data = JSON.parse(Buffer.from(file.content, 'base64').toString())
  return { data, sha: file.sha as string }
}

async function saveTripJson(
  cfg: GhConfig,
  tripId: string,
  data: Record<string, unknown>,
  sha: string | undefined,
  message: string
) {
  await ghPut(cfg, tripPath(cfg, tripId), JSON.stringify(data, null, 2), message, sha)
}

function syncIndexEntry(list: IndexEntry[], tripId: string, data: Record<string, unknown>) {
  const meta = data.meta as { title?: string; startISO?: string; endISO?: string } | undefined
  const entry: IndexEntry = {
    id: tripId,
    title: meta?.title ?? tripId,
    startISO: meta?.startISO ?? '',
    endISO: meta?.endISO ?? '',
  }
  const idx = list.findIndex(e => e.id === tripId)
  if (idx === -1) list.push(entry)
  else list[idx] = entry
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  let cfg: GhConfig
  try {
    cfg = githubConfig()
  } catch (e) {
    return { statusCode: 500, body: String(e) }
  }

  let action: string, tripId: string, title: string | undefined, newTripId: string | undefined
  try {
    ;({ action, tripId, title, newTripId } = JSON.parse(event.body ?? '{}'))
    if (!action || !tripId) throw new Error('missing action or tripId')
  } catch (e) {
    return { statusCode: 400, body: String(e) }
  }

  try {
    if (action === 'rename') {
      if (!title?.trim()) throw new Error('missing title')
      const { data, sha } = await loadTripJson(cfg, tripId)
      const meta = (data.meta ?? {}) as Record<string, unknown>
      meta.title = title.trim()
      data.meta = meta
      await saveTripJson(cfg, tripId, data, sha, `trip: rename ${tripId}`)
      const { list, sha: indexSha } = await loadIndex(cfg)
      syncIndexEntry(list, tripId, data)
      await saveIndex(cfg, list, indexSha, `trip: rename index ${tripId}`)
      return { statusCode: 200, body: JSON.stringify({ ok: true, title: title.trim() }) }
    }

    if (action === 'delete') {
      const tripFile = await ghGet(cfg, tripPath(cfg, tripId))
      if (!tripFile) throw new Error(`Trip not found: ${tripId}`)
      const { list, sha: indexSha } = await loadIndex(cfg)
      const next = list.filter(e => e.id !== tripId)
      await saveIndex(cfg, next, indexSha, `trip: delete index ${tripId}`)
      await ghDelete(cfg, tripPath(cfg, tripId), `trip: delete ${tripId}`, tripFile.sha)
      return { statusCode: 200, body: JSON.stringify({ ok: true }) }
    }

    if (action === 'duplicate') {
      if (!newTripId?.trim() || !/^[a-z0-9-]+$/.test(newTripId)) {
        throw new Error('newTripId must be lowercase letters, numbers, and hyphens only')
      }
      const targetId = newTripId.trim()
      const existing = await ghGet(cfg, tripPath(cfg, targetId))
      if (existing) throw new Error(`Trip already exists: ${targetId}`)

      const { data } = await loadTripJson(cfg, tripId)
      const meta = (data.meta ?? {}) as Record<string, unknown>
      const baseTitle = (meta.title as string) || tripId
      meta.title = title?.trim() || `${baseTitle} (copy)`
      data.meta = meta

      await saveTripJson(cfg, targetId, data, undefined, `trip: duplicate ${tripId} → ${targetId}`)
      const { list, sha: indexSha } = await loadIndex(cfg)
      syncIndexEntry(list, targetId, data)
      await saveIndex(cfg, list, indexSha, `trip: duplicate index ${targetId}`)
      return { statusCode: 200, body: JSON.stringify({ ok: true, newTripId: targetId }) }
    }

    return { statusCode: 400, body: `Unknown action: ${action}` }
  } catch (e) {
    console.error(e)
    return { statusCode: 500, body: String(e) }
  }
}
