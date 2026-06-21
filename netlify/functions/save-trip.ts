import type { Handler } from '@netlify/functions'

const API = 'https://api.github.com'

type GhConfig = { token: string; owner: string; repo: string }

// Bracket access so esbuild doesn't inline undefined at bundle time
function githubConfig(): GhConfig {
  const token = process.env['GITHUB_TOKEN']
  const owner = process.env['GITHUB_OWNER']
  const repo = process.env['GITHUB_REPO']
  if (!token || !owner || !repo) {
    throw new Error('Missing GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO in environment')
  }
  return { token, owner, repo }
}

async function ghGet(cfg: GhConfig, path: string) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
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
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GitHub PUT ${path} → ${res.status}: ${err}`)
  }
  return res.json()
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

  let tripId: string, tripData: Record<string, unknown>
  try {
    ;({ tripId, tripData } = JSON.parse(event.body ?? '{}'))
    if (!tripId || !tripData) throw new Error('missing tripId or tripData')
  } catch (e) {
    return { statusCode: 400, body: String(e) }
  }

  const repoBase = `/repos/${cfg.owner}/${cfg.repo}/contents`

  try {
    // 1 — write trip JSON
    const tripPath = `${repoBase}/public/trips/${tripId}.json`
    const existing = await ghGet(cfg, tripPath)
    await ghPut(
      cfg,
      tripPath,
      JSON.stringify(tripData, null, 2),
      `trip: update ${tripId}`,
      existing?.sha
    )

    // 2 — update index.json
    const indexPath = `${repoBase}/public/trips/index.json`
    const indexFile = await ghGet(cfg, indexPath)
    let index: Array<{ id: string; title: string; startISO: string; endISO: string }> = []
    if (indexFile) {
      try { index = JSON.parse(Buffer.from(indexFile.content, 'base64').toString()) } catch { index = [] }
    }

    const meta = tripData.meta as { title?: string; startISO?: string; endISO?: string }
    if (!index.find(e => e.id === tripId)) {
      index.push({
        id: tripId,
        title: meta?.title ?? tripId,
        startISO: meta?.startISO ?? '',
        endISO: meta?.endISO ?? '',
      })
    } else {
      const idx = index.findIndex(e => e.id === tripId)
      index[idx] = {
        id: tripId,
        title: meta?.title ?? tripId,
        startISO: meta?.startISO ?? '',
        endISO: meta?.endISO ?? '',
      }
    }

    await ghPut(
      cfg,
      indexPath,
      JSON.stringify(index, null, 2),
      `trip: sync index for ${tripId}`,
      indexFile?.sha
    )

    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (e) {
    console.error(e)
    return { statusCode: 500, body: String(e) }
  }
}
