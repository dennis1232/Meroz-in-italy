# Meroz In Italia — Product Summary

## What It Is

A white-label PWA travel guide built for family trip operators. One JSON file drives the entire experience. No app store, no backend, no login. Travelers open a link — that's it.

---

## Who Uses It

| Role | What they do |
|------|-------------|
| **Admin (trip creator)** | Builds and maintains the guide via `/admin` — desktop editor, no code required |
| **Traveler** | Opens the link on mobile, uses the app like a native app (can install to home screen) |

---

## Traveler Features

### 5 Tabs

| Tab | Content |
|-----|---------|
| **Home** | Cover photo, countdown to departure, polaroid grid of all days |
| **Itinerary** | Full day-by-day schedule with stops, times, tags, Map & Waze links |
| **Map** | Interactive map with all stop pins, filtered by day |
| **Highlights** | Curated attractions + must-see places grid with map links |
| **Info** | Driving tips (7 cards) + contact details (Instagram, IL/IT phone numbers, useful links) |

### Stop Features (per stop in itinerary)
- Tag icon: `🍽 food`, `☕ cafe`, `🏛 site`, `🍷 wine`, `🍦 gelato`, `🏨 hotel`, `🛍 shop`
- Optional time badge (e.g. `10:00`)
- Description text
- **Map button** → opens Google Maps at exact coordinates
- **Parking mode** → shows Waze "park here" deep-link instead of Map
- **Drive legs** → rendered as route connectors with Waze navigation link

### Smart Behaviors
- **Today detection**: on open, auto-navigates to today's day in the itinerary
- **Offline-first**: service worker caches everything after first load — works in airplane mode
- **PWA install**: prompts iOS (Share → Add to Home Screen) or Android (native install prompt)
- **Intro modal**: shown once on first visit, explains offline use + install steps; "Don't show again" checkbox
- **Countdown**: live days-to-flight counter on home screen cover

---

## Admin Features (`/admin` route — desktop only)

### Layout
- Sticky sidebar nav: jump to Cover, any Day, Attractions, Places, Contact
- 2-column day editor (meta + photo left, stops right)
- Live JSON preview panel (dark, copyable)

### Cover & Trip Details
- Title, subtitle, country
- Start/end dates
- Travellers tagline
- Cover image (upload or URL)
- **Language selector**: Hebrew (RTL) or English (LTR) — controls entire traveler UI

### Day Editor
- Day title, date (auto-derives `dd/mm`, day-of-week, ISO)
- Hero photo (upload or URL)
- Intro paragraph
- Full stop list editor per day

### Stop Editor (per stop)
- Name, description, time
- Tag dropdown
- Parking toggle
- Move/transit leg toggle (drive, train, flight)
- **Location input**: accepts:
  - Direct `lat, lng` coordinates
  - Full Google Maps URL (auto-extracts coordinates)
  - Short `maps.app.goo.gl` URL (expands via CORS proxy → extracts coordinates)

### Attractions & Places
- Name, Hebrew name, description
- Photo (upload or URL)
- Location (same flexible input as stops)

### Contact Details
- Instagram handle
- Israel phone number (display + `tel:` raw)
- Italy phone number (display + `tel:` raw)

### Data Flow
- **Autosave**: every edit writes to `localStorage` draft
- **Live preview**: admin writes to `localStorage['meroz-live-preview']` + sends via `BroadcastChannel`
- **Preview button**: opens `/?preview` in new tab — loads from localStorage, receives live BroadcastChannel updates
- **Export**: Download JSON button → clean `trip.json` ready to deploy
- **Import**: Load JSON file → populates editor
- **Reset**: revert to last saved state

---

## Multilingual Support

| Setting | Hebrew (`he`) | English (`en`) |
|---------|--------------|----------------|
| Layout direction | RTL | LTR |
| Tab labels | בית / מסלול / מפה / אטרקציות / מידע | Home / Itinerary / Map / Highlights / Info |
| Day of week | יום רביעי | Wednesday |
| Date format | English date shown as-is | June 24 |
| Countdown | ✈️ עוד X ימים לטיסה! | ✈️ X days to go! |
| Driving tips | 7 Hebrew cards | 7 English cards |
| All UI strings | Hebrew | English |
| Intro modal | Full Hebrew | Full English |

Language is set once by the admin per trip — travelers see one language, no toggle.

---

## Technical Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + Vite 5 + TypeScript |
| Styling | Plain CSS (no framework), RTL via `dir` attribute |
| PWA | Vite PWA plugin + service worker |
| Routing | Pathname-based (`/admin` vs `/`) — no router library |
| State | Module-level exports (`meta`, `days`) + `initTrip()` — no Redux/Zustand |
| Live preview | `BroadcastChannel('meroz-trip')` + `localStorage` seed |
| Maps | Google Maps links + Waze deep-links (no API key needed) |
| Short URL expand | `allorigins.win` CORS proxy |
| Hosting | Netlify (`_redirects` for SPA routing) |
| Data | Single `public/trip.json` — fetched at boot, cached by SW |

---

## Deployment

1. Edit trip in `/admin`
2. Download `trip.json`
3. Replace `public/trip.json`
4. Push to Netlify → live in seconds

No build step needed per trip. Same codebase serves all trips.

---

## PM Assessment

### Strengths
- **Zero friction for travelers** — URL → usable app in one tap, offline after that
- **No backend** — nothing to maintain, no auth, no costs at scale
- **White-label ready** — swap `trip.json` + assets for a new trip
- **Admin is genuinely usable** — non-technical person can build a full guide without touching code
- **Short URL support** — operators can paste any Google Maps link format without worrying about coordinates

### Gaps / Next Opportunities
- **No versioning / history** in admin — one bad edit can wipe draft; consider undo stack or snapshot saves
- **No multi-trip management** — admin handles one trip at a time; a trip selector or cloud sync would unlock scale
- **Cover photo UX** — large images as data URLs bloat JSON significantly; an image hosting step would help
- **Parking button still Hebrew** (`🅿️ להחנות פה`) when app is in English — small but visible gap
- **No sharing / social layer** — travelers can't share a specific stop or day; deep-link URLs to days would be useful
- **Analytics** — zero visibility into which stops/days travelers actually use; even simple ping telemetry would help
