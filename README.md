# dtv

Live TV from everywhere. Stream 7,000+ free channels from iptv-org directly in your browser.
Install as a PWA, watch on any screen.

## What it is

dtv is an open-source IPTV web app. It aggregates publicly available live TV streams from
[iptv-org](https://github.com/iptv-org/iptv) — news, sports, entertainment, music, kids, and
more — searchable and filterable by country, category, and language.

**Custom playlists:** Paste your own M3U/Xtream subscription URL to merge private channels
alongside the public catalog.

## Stream filtering

dtv only plays streams that meet all of these criteria:
- URL uses HTTPS
- No authentication headers (no user_agent or referrer required)
- Channel is not marked NSFW
- Channel is not closed/blocked

This keeps streams reliably playable without credentials and avoids distributing
links to paywalled content.

## Features

- 7,000+ live channels from iptv-org, refreshed every 6 hours
- Search + filter by country, category, language
- Netflix-style home with hero + category rows
- Full TV guide (EPG grid)
- Custom M3U/Xtream playlist import
- Cast to TV (Chromecast + AirPlay)
- Quality/data-saver stream picker
- Multi-view: watch up to 4 channels simultaneously
- Sleep timer
- Program reminders (browser notifications)
- D-pad / TV-remote spatial navigation
- Channel detail with full EPG schedule
- Share channels (Web Share API + OG cards)
- Browse directory by category and country
- Bilingual EN/አማርኛ
- PWA: installable, offline mode, background sync
- Favorites, recently watched (persisted locally)
- Dark / dim / light themes

## Stack

- **Framework:** SvelteKit 5 (Svelte 5 runes)
- **Styling:** Tailwind CSS v4 + CSS custom properties
- **HLS:** hls.js (lazy-loaded, native fallback for Safari)
- **Data:** [iptv-org](https://github.com/iptv-org/iptv) public APIs
- **EPG:** iptv-org EPG guides
- **PWA:** vite-plugin-pwa (Workbox)
- **Deploy:** Vercel (adapter-vercel)

## Dev

```
pnpm install
pnpm dev
```

Open [localhost:5173](http://localhost:5173).

## Build + deploy

```
pnpm build
pnpm preview
```

Deploy to Vercel: push to main or run `vercel --prod`.

## Architecture

```
iptv-org APIs → getCatalog() (6h cache)
             ↓
     /api/channels  (filter + paginate)
     /api/epg       (program guide)
     /api/filters   (country/category/language counts)
     /api/home      (hero + category rows)
     /api/playlist  (custom M3U import)
             ↓
  catalog.svelte.ts + playlists.svelte.ts (client state)
             ↓
       ChannelGrid, HomeView, PlayerOverlay (UI)
```
