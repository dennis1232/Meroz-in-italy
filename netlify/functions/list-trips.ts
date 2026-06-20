import type { Handler } from '@netlify/functions'

const API = 'https://api.github.com'

function githubConfig() {
  const token = process.env['GITHUB_TOKEN']
  const owner = process.env['GITHUB_OWNER']
  const repo = process.env['GITHUB_REPO']
  if (!token || !owner || !repo) {
    throw new Error('Missing GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO in environment')
  }
  return { token, owner, repo }
}

export const handler: Handler = async () => {
  let cfg: ReturnType<typeof githubConfig>
  try {
    cfg = githubConfig()
  } catch (e) {
    return { statusCode: 500, body: String(e) }
  }

  try {
    const path = `/repos/${cfg.owner}/${cfg.repo}/contents/public/trips/index.json`
    const res = await fetch(`${API}${path}`, {
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    if (res.status === 404) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([]),
      }
    }
    if (!res.ok) throw new Error(`GitHub GET → ${res.status}`)
    const file = await res.json()
    const list = JSON.parse(Buffer.from(file.content, 'base64').toString())
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list),
    }
  } catch (e) {
    console.error(e)
    return { statusCode: 500, body: String(e) }
  }
}
