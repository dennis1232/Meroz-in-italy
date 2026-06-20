# Making a new customer trip 🧳

Every trip is the same app + a different `trip.json` (which also holds the photos).
You build the data in the editor, download a ready site, and drag it to Netlify.

## One-time setup (done once, ever)
1. Build the app: `nvm use 20 && npm run build`
2. Deploy the `dist/` folder once to Netlify (e.g. `my-trip-builder.netlify.app`).
   This deployed site is your **editor** — you'll use it to make every trip.

## Make a trip (repeat per customer)
1. Open the editor site and add `#admin` to the URL → `…netlify.app/#admin`
2. Fill it in:
   - **Cover & details**: title, dates (date picker), travellers line, cover photo
   - **Days**: pick a date (day-of-week + labels fill in automatically), title, intro,
     hero photo, and stops
   - **Stops**: name, time, tag (food/site/wine…), description, and a location —
     just **paste a Google Maps or Waze link** and it grabs the coordinates
   - **Attractions / Places**: the "must-see" cards with photos
3. Click **💾 Save** as you go (autosaves in the browser).
4. Click **📦 Download site** → you get `name-site.zip` (photos baked in).
5. Go to **https://app.netlify.com/drop** and drag the zip in → live in seconds.

That's it. Each zip is a complete, self-contained site.

## Notes
- **Photos** are stored inside `trip.json` as compressed images, so the zip needs no
  separate asset files. Big photos are auto-shrunk on upload.
- **Editing locally** (developer): run `npm run dev`, open `/#admin`. In Chrome you can
  click **🔗 Link trip.json**, pick `public/trip.json`, and **Save** writes straight to
  disk with instant hot-reload.
- **Browser**: the editor's photo/link/zip features work best in Chrome or Edge.
- **Reset** discards your browser draft and reloads the published `trip.json`.
