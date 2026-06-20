# Meroz Trip App

A mobile-first **Progressive Web App (PWA)** for sharing beautiful, offline-capable travel itineraries with your group. Trip advisors build trips in a web admin; travelers open a link on their phone, install it to their home screen, and use it throughout the trip — even with patchy signal.

Built with React + Vite. Deployed on Netlify. Trip data is stored as JSON in GitHub.

---

## What travelers see

Each trip opens at `/trip/{trip-id}` and includes five tabs:

| Tab | What it shows |
|-----|----------------|
| **Home** | Cover photo, trip title, dates, and a polaroid-style grid of all days |
| **Itinerary** | Expandable day cards with stops, times, descriptions, per-day map, and navigation links |
| **Map** | All stops on one map, filterable by day |
| **Must-See** | Recommended attractions and places with photos and map links |
| **Info** | Driving tips (Telepass, ZTL, Waze, etc.) and contact details |

**Key traveler features:**
- Works **offline** after the first load (app shell, fonts, and photos are cached; map tiles cache as you pan)
- **Installable** — travelers can Add to Home Screen on iPhone/Android for a full-screen app experience
- **RTL support** — Hebrew by default; English trips flip layout automatically
- **Navigation** — each stop with coordinates opens Google Maps or Waze for turn-by-turn directions
- **Auto-jump to today** — on the trip start date, the app opens directly on that day's itinerary

---

## How it works (high level)

```
Trip advisor (admin)          Travelers (PWA)
       │                              │
       ▼                              ▼
  /admin/{trip-id}            /trip/{trip-id}
       │                              │
       ▼                              ▼
  Edit in browser          Read trip JSON + show UI
       │                              │
       ▼                              │
  ☁️ Save ──► Netlify function ──► GitHub repo
       │         (save-trip)          │
       │                              │
       └──── public/trips/*.json ◄────┘
```

- **Multiple trips** — each trip has its own ID, JSON file, and public link
- **Drafts** — the admin auto-saves your work to the browser (`localStorage`) every few seconds
- **Publish** — clicking **Save** pushes the trip JSON to GitHub via a Netlify serverless function; Netlify redeploys and travelers get the update
- **Images** — uploaded in the admin and stored in the trip JSON (embedded or hosted URLs)

---

## For trip advisors — before you start

### Access the admin

| URL | Purpose |
|-----|---------|
| `/admin` | Trip list — create, rename, duplicate, delete trips |
| `/admin/{trip-id}` | Edit a specific trip |

Example: `https://your-site.netlify.app/admin`

### One-time setup (handled by your developer)

These environment variables must be configured in **Netlify** (and in a local `.env` file for development):

| Variable | Purpose |
|----------|---------|
| `GITHUB_TOKEN` | GitHub personal access token with **Contents: Read and write** on the repo |
| `GITHUB_OWNER` | GitHub username or org |
| `GITHUB_REPO` | Repository name (case-sensitive) |

Copy `.env.example` to `.env` and fill in values for local development.

### Local development

Requires Node **18+**.

```bash
npm install
npm run dev:netlify   # Vite on :5173 + Netlify functions on :9999
```

Open **http://localhost:5173/admin**.

> **Important:** Use `npm run dev:netlify`, not `npm run dev`. Plain Vite does not serve the Save / duplicate / delete functions.

---

## Creating a new trip — step by step

### 1. Create the trip

1. Go to `/admin`
2. Click **+ New trip**
3. Enter a **Trip ID** — this becomes part of the public URL

**Trip ID rules:**
- Lowercase letters, numbers, and hyphens only
- Examples: `meroz-italy-2026`, `cohen-france-2027`
- Cannot be changed later — choose carefully
- Must be unique across all trips

4. Click **Create trip** — you are taken to the trip editor

### 2. Fill in trip cover & details

At the top of the editor, under **Trip cover & details**:

| Field | What travelers see | Tips |
|-------|-------------------|------|
| **Title** | Main heading on the home screen | e.g. `Meroz In Italia` |
| **Subtitle** | Secondary line under the title | e.g. `Tuscany & Rome` |
| **Country** | Shown on the cover | e.g. `Italy` |
| **Start date / End date** | Trip date range on the cover | Use the date picker — ISO format is stored automatically |
| **Travellers line** | Short tagline | e.g. `Sharon & Dennis · Tuscany & Rome 🇮🇹` |
| **App language** | Controls text direction and UI language | **Hebrew (עברית)** = RTL · **English** = LTR |
| **Cover photo** | Full-width hero on the home tab | Upload a landscape photo (see [Photos](#photos) below) |

Changes are **auto-saved locally** as you type. You'll see **✓ saved** in the top bar when the draft is stored in your browser.

### 3. Add days

Use the left sidebar to jump between sections, or scroll the main panel.

1. Click **+ Add day** in the sidebar (or at the bottom of the day list)
2. Expand the day card by clicking its header
3. Fill in:

| Field | Purpose |
|-------|---------|
| **Date** | Pick from the calendar — day-of-week labels (Hebrew + English) are filled in automatically |
| **Title (banner)** | Short headline shown on the day card | e.g. `BENVENUTI IN ITALIA 😊` |
| **Intro** | Opening paragraph for the day — shown when the day card is expanded |
| **Hero photo** | Banner image at the top of the day card |

**Delete a day:** click the **✕** on the day header (you'll be asked to confirm).

Days are numbered automatically (Day 1, Day 2, …). Use the **↑ ↓** buttons on stops to reorder items within a day.

### 4. Add stops to each day

Stops are the individual items on the itinerary — flights, train rides, hotels, restaurants, sights, etc.

Click **+ Add stop**, then expand the stop to edit:

| Field | Purpose |
|-------|---------|
| **Name** | Stop title shown to travelers |
| **Time** | Optional — e.g. `20:00` or `16:55–18:31` |
| **Tag** | Icon category: food, cafe, site, wine, gelato, hotel, shop |
| **Description** | Details shown under the stop name |
| **Location** | Paste a Google Maps or Waze link (see [Locations](#locations) below) |

**Special stop types** (checkboxes):

| Option | When to use | What travelers see |
|--------|-------------|-------------------|
| **Move leg** | Travel between places (drive, train, flight) | Shows with ✈️ / 🚆 / 🚗 icon instead of a tag |
| **Via** (when Move leg is on) | Type of transport | `drive`, `train`, or `flight` |
| **Parking** | A parking stop | Shows with 🅿️ icon |

Stops **with coordinates** appear on the day map and the main Map tab, and get a navigation button.

### 5. Add recommendations (Must-See tab)

Scroll to **Recommendations** in the editor. There are two lists:

#### ⭐ Attractions (must-see)
Curated highlights with photo, English name, description, and map link. Shown as cards in the **Must-See → Attractions** section.

| Field | Purpose |
|-------|---------|
| **Name (en)** | English title on the card |
| **Name (he)** | Hebrew name (stored in data; useful for bilingual trips) |
| **Description** | Text under the photo |
| **Photo** | Card image |
| **Location** | Map link for "Open in map" |

#### 📍 Places
Shorter entries — photo + name + map link. Shown as a photo grid in **Must-See → Places**.

Same fields as attractions. Keep names concise; descriptions are optional but not shown in the places grid.

### 6. Contact details

Under **Contact**, fill in what appears in the **Info** tab:

| Field | Example |
|-------|---------|
| **Instagram** | `meroz_in_toscana` (handle only, no `@`) |
| **Phone IL** | Israeli number as travelers should dial it |
| **Phone IT** | Local number at the destination |

Phone fields automatically store a dial-ready version (digits only) for tap-to-call links.

### 7. Preview before publishing

Click **👁 Preview** in the top bar. This opens the traveler app in a new tab using your **local draft** — what you see is exactly what's in the editor, even before saving to the cloud.

Add `?preview` to the URL manually if needed: `/trip/{trip-id}?preview`

### 8. Publish (Save to cloud)

When the trip is ready for travelers:

1. Click **☁️ Save** in the top bar
2. Wait for the save to complete — errors appear in red if something fails
3. Netlify redeploys automatically after GitHub is updated (usually 1–2 minutes)

**Save writes two files to GitHub:**
- `public/trips/{trip-id}.json` — full trip data
- `public/trips/index.json` — trip registry (title, dates, ID)

> Travelers always load the **published** version from GitHub. Local drafts are only visible to you until you Save.

### 9. Share with travelers

1. Click **🔗 Copy link** in the editor (or **Link** on the trip card in `/admin`)
2. Send the URL: `https://your-site.netlify.app/trip/{trip-id}`
3. Tell travelers to open it in Safari (iPhone) or Chrome (Android) and **Add to Home Screen**

---

## Reference

### Photos

Click **📷 Upload** on any photo field. Images are saved into the trip JSON and appear in the traveler app after you **Save**.

### Locations

Paste any of these into the location field:

- Google Maps link (`https://maps.app.goo.gl/...` or full Google Maps URL)
- Waze link
- Raw coordinates: `43.7731, 11.256`

The admin extracts latitude/longitude automatically and shows a map preview. Short Google links (`maps.app.goo.gl`) are expanded before parsing.

**Tips:**
- Open the place in Google Maps or Waze on your phone → Share → Copy link → paste into the admin
- Stops without a location still appear in the itinerary text but won't show on maps
- The stored link is what opens when travelers tap Navigate

### Stop tags

| Tag | Icon | Use for |
|-----|------|---------|
| food | 🍽️ | Restaurants, dinners |
| cafe | ☕ | Coffee, bars, aperitivo |
| site | 🏛️ | Museums, churches, landmarks |
| wine | 🍷 | Wineries, tastings |
| gelato | 🍦 | Gelato stops |
| hotel | 🏨 | Accommodations, check-in |
| shop | 🛍️ | Shopping |

### Managing trips (`/admin`)

From the trips list, each trip card has a toolbar:

| Action | What it does |
|--------|-------------|
| **Rename** | Changes the display title only — trip ID and URL stay the same |
| **Duplicate** | Copies the entire trip to a new ID — useful as a template for next year's trip |
| **Link** | Copies the public traveler URL to clipboard |
| **Delete** | Removes the trip from GitHub permanently — cannot be undone |

Click the trip title area to open the editor.

Use **Search** to filter trips by name or ID.

### What is NOT editable in the admin

The **Info → Driving tips** section (Telepass, ZTL zones, Waze, speed cameras, etc.) is built into the app code (`src/i18n.ts`), not per-trip. Contact your developer if tips need updating for a new destination.

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---------|-------------|-----|
| **Save failed: 404** | Running plain `npm run dev` | Use `npm run dev:netlify` locally, or save on the deployed Netlify site |
| **Missing GITHUB_TOKEN…** | Env vars not set | Add GitHub credentials to `.env` (local) or Netlify dashboard (production) |
| **GitHub GET …/undefined/undefined…** | `GITHUB_OWNER` or `GITHUB_REPO` missing | Check `.env` values match your repo exactly |
| **Duplicate / rename / delete fails** | Same as Save — needs Netlify functions + GitHub | Use deployed site or `npm run dev:netlify` |
| **Trip already exists** | Duplicate target ID is taken | Pick a different trip ID |
| **Travelers see old content** | Netlify hasn't redeployed yet | Wait 1–2 min after Save, or hard-refresh |
| **Preview works but live trip is empty** | Never clicked Save | Click **☁️ Save** to publish |

---

## Developer notes

```bash
npm run build      # production build → dist/
npm run preview    # serve dist locally
npm test           # run tests
```

**Project structure (key paths):**

```
public/trips/
  index.json          # trip registry
  {trip-id}.json      # one file per trip
src/admin/            # trip editor UI
netlify/functions/
  save-trip.ts        # publish trip to GitHub
  trip-manage.ts      # rename / duplicate / delete
```

**Routing:**

| Path | Component |
|------|-----------|
| `/` | 404 — no default trip |
| `/trip/{id}` | Traveler app (404 if trip JSON missing) |
| `/trip/{id}?preview` | Preview from localStorage draft |
| `/admin` | Trip list |
| `/admin/{id}` | Trip editor |
| anything else | 404 |

---

## License

Private project — Meroz travel itineraries.
