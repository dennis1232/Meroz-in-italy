// Post-build: list every file in dist/ into dist/site-files.json.
// The in-app editor (/#admin) fetches this to repackage the whole site (with a
// fresh trip.json) into a downloadable zip — the "make another customer site" flow.
// Runs after `vite build` so the PWA service worker (sw.js, workbox-*.js) is included.
import fs from 'node:fs'
import path from 'node:path'

const dist = path.resolve('dist')
if (!fs.existsSync(dist)) {
  console.error('gen-manifest: dist/ not found')
  process.exit(1)
}

const files = []
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name)
    if (e.isDirectory()) walk(fp)
    else {
      const rel = path.relative(dist, fp).split(path.sep).join('/')
      if (rel !== 'site-files.json') files.push(rel)
    }
  }
}
walk(dist)
fs.writeFileSync(path.join(dist, 'site-files.json'), JSON.stringify(files))
console.log(`gen-manifest: wrote site-files.json (${files.length} files)`)
