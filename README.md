# dtv

Browser-based live TV player for the [iptv-org](https://github.com/iptv-org/iptv) catalog — ~7,600 playable streams from channels worldwide, direct in your browser. No app, no subscription.

## Stack

SvelteKit 5 · Svelte 5 runes · Tailwind CSS v4 · TypeScript strict · Biome v2 · pnpm v10 · Vercel

## Data

Channels, streams, and metadata from the [iptv-org API](https://iptv-org.github.io/api/) (static JSON, CORS-open). ~40k channels total; dtv filters to ~7,600 playable streams: `https` only, no required `user_agent`/`referrer` headers, non-NSFW, active channels. Some streams may still fail due to CORS restrictions or geo-blocking — this is unavoidable without a server proxy.

## Architecture

```
iptv-org JSON → getCatalog() [6h module cache] → /api/channels, /api/filters, /api/home
                                                         ↓
                                         CatalogState (Svelte 5 runes singleton)
                                         PlayerState  (play-queue, zap navigation)
                                         LibraryState (favorites + recents, localStorage)
                                                         ↓
                                         +page.svelte → ChannelGrid + PlayerOverlay
```

## Dev

```bash
pnpm install
pnpm dev          # localhost:5173
pnpm build        # production build
pnpm check        # svelte-check + tsc
pnpm lint         # biome check
```
