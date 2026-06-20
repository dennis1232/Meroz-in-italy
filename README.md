# Meroz In Italia 🇮🇹 — מסלול טוסקנה & רומא

React + Vite PWA. Mobile-first. No server, no DB — pure client. Works **offline** after first load (app shell + all photos/fonts are precached; map tiles cache as you view them).

Built from the original Meroz travel-itinerary PDF: 13-day trip, 22/06–04/07.

## Screens
- 🏠 **בית / Overview** — cover + polaroid grid
- 📅 **מסלול / Itinerary** — 13 expandable day cards, each with a per-day Leaflet map + Google-Maps links
- 🗺️ **מפה / Map** — all 86 stops on one map, filterable by day
- ⭐ **אטרקציות / Must-See** — attractions + places (real photos)
- ℹ️ **מידע / Info** — driving tips (Telepass/ZTL/speed) + contact

## Requirements
Node **18+** (built/tested on Node 24). The default shell Node here is v16 — use:
```bash
nvm use 24    # or any 18+
```

## Run locally
```bash
cd ~/Desktop/Meroz-Italy
npm install
npm run dev        # http://localhost:5173
```
Production build → static files in `dist/`:
```bash
npm run build
npm run preview    # serves dist locally
```

## Put it on your phone (installable, offline)
A PWA must be served over **HTTPS** to install. Easiest path, no account juggling:

1. `npm run build`
2. Go to **https://app.netlify.com/drop** and drag the `dist/` folder in.
3. Open the HTTPS URL it gives you, on your iPhone (Safari).
4. Share → **Add to Home Screen**. Now it opens full-screen and works offline (incl. the maps you've already panned over).

Alternatives: GitHub Pages, Vercel, Cloudflare Pages — all free static hosts. `base: './'` is set so it works from any sub-path.

## Notes
- Maps: Leaflet + OpenStreetMap (no API key). Tiles need network the first time; viewed areas are cached for offline.
- GPS coordinates for most stops are in `src/data.ts` — tweak any that need fixing.
- "מפה ↗" / "ניווט" links open Google Maps for turn-by-turn.
