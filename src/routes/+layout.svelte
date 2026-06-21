<script lang="ts">
import '../app.css'
import { onMount } from 'svelte'
import { page } from '$app/stores'
import { locale } from '$lib/i18n.js'
import { settings } from '$lib/state/settings.svelte.js'
import { player } from '$lib/state/player.svelte.js'
import { library } from '$lib/state/library.svelte.js'

let { children } = $props()

let miniVideoEl = $state<HTMLVideoElement | null>(null)
const isHome = $derived($page.url.pathname === '/')

onMount(() => {
  settings.init()
  library.init()
  $effect(() => {
    document.documentElement.setAttribute('data-theme', settings.settings.theme)
  })
  $effect(() => {
    locale.set(settings.settings.locale)
  })
})

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/guide', label: 'Guide' },
  { href: '/browse', label: 'Browse' },
  { href: '/settings', label: 'Settings' },
]
</script>

<svelte:head>
  <title>dtv</title>
  <meta name="description" content="Live TV from everywhere" />
  <meta name="theme-color" content="#0a0a0a" />
  <link rel="manifest" href="/manifest.webmanifest" />
</svelte:head>

{@render children()}

{#if player.current && !isHome}
  <div
    style="position:fixed; bottom:20px; right:20px; z-index:50; width:280px; background:var(--color-surface); border:1px solid var(--color-border); border-radius:12px; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.4);"
    role="region"
    aria-label="Mini player"
  >
    <video
      bind:this={miniVideoEl}
      style="width:100%; aspect-ratio:16/9; display:block; background:#000;"
      autoplay
      playsinline
      muted
    ></video>
    <div style="padding:8px 12px; display:flex; align-items:center; gap:8px;">
      <div style="flex:1; min-width:0;">
        <div style="font-size:12px; font-weight:700; color:var(--color-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{player.current.name}</div>
      </div>
      <a href="/?watch={player.current.id}" style="padding:4px 10px; border:1px solid var(--color-border); border-radius:6px; font-size:11px; font-weight:700; color:var(--color-text-muted); text-decoration:none;">OPEN</a>
      <button onclick={() => player.close()} style="padding:4px 8px; border:none; background:none; color:var(--color-text-dim); font-size:16px; cursor:pointer;" aria-label="Close player">×</button>
    </div>
  </div>
{/if}
