<script lang="ts">
import type { Channel } from '$lib/types.js'

type Program = { title: string; start: string; stop: string; description: string | null }

type Props = {
  channel: Channel
  isFavorite: boolean
  onclose: () => void
  onwatch: () => void
  onfavorite: (id: string) => void
}
let { channel, isFavorite, onclose, onwatch, onfavorite }: Props = $props()

let programs = $state<Program[]>([])
let loaded = $state(false)
let copied = $state(false)

$effect(() => {
  const id = channel.id
  programs = []
  loaded = false
  fetch(`/api/epg?channelId=${encodeURIComponent(id)}`)
    .then(r => r.json())
    .then((data: { programs: Program[] }) => {
      programs = data.programs ?? []
      loaded = true
    })
    .catch(() => { loaded = true })
})

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

async function share() {
  const url = `${window.location.origin}/?watch=${encodeURIComponent(channel.id)}`
  if ('share' in navigator) {
    try { await navigator.share({ title: channel.name, url }); return } catch {}
  }
  try {
    await navigator.clipboard.writeText(url)
    copied = true
    setTimeout(() => { copied = false }, 2000)
  } catch {}
}
</script>

<!-- Overlay backdrop -->
<div
  class="glass-overlay"
  style="position:fixed; inset:0; z-index:60; display:flex; align-items:flex-end; justify-content:center; padding:0 0 0 0;"
  onclick={onclose}
  role="presentation"
></div>

<!-- Sheet -->
<div
  style="position:fixed; bottom:0; left:0; right:0; z-index:61; background:var(--color-surface); border-top:1px solid var(--color-border); border-radius:20px 20px 0 0; padding:24px; max-width:600px; margin:0 auto; max-height:80vh; overflow-y:auto;"
  role="dialog"
  aria-modal="true"
  aria-label="{channel.name} details"
>
  <!-- Handle bar -->
  <div style="width:40px; height:4px; background:var(--color-border); border-radius:2px; margin:0 auto 20px;"></div>

  <!-- Header -->
  <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px;">
    {#if channel.logo}
      <img src={channel.logo} alt="" style="width:64px; height:64px; object-fit:contain; border-radius:8px; background:var(--color-surface-raised);" loading="lazy" />
    {:else}
      <div class="channel-initials" style="width:64px; height:64px; border-radius:8px;">{channel.name.slice(0,2).toUpperCase()}</div>
    {/if}
    <div style="flex:1; min-width:0;">
      <div style="font-size:1.25rem; font-weight:900; letter-spacing:-0.03em; color:var(--color-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{channel.name}</div>
      <div style="font-size:0.875rem; color:var(--color-text-muted); margin-top:2px;">{channel.countryFlag} {channel.categories[0] ?? ''}</div>
    </div>
  </div>

  <!-- Action buttons -->
  <div style="display:flex; gap:8px; margin-bottom:24px; flex-wrap:wrap;">
    <button onclick={onwatch} style="flex:1; min-width:120px; padding:10px 20px; background:var(--color-text); color:var(--color-background); border:none; border-radius:8px; font-family:var(--font-sans); font-size:14px; font-weight:700; letter-spacing:0.04em; cursor:pointer;">WATCH</button>
    <button onclick={() => onfavorite(channel.id)} style="padding:10px 16px; border:1px solid var(--color-border); background:var(--color-surface-raised); color:{isFavorite ? 'var(--color-text)' : 'var(--color-text-muted)'}; border-radius:8px; font-family:var(--font-sans); font-size:13px; cursor:pointer;">{isFavorite ? '★ Saved' : '☆ Save'}</button>
    <button onclick={share} style="padding:10px 16px; border:1px solid var(--color-border); background:var(--color-surface-raised); color:var(--color-text-muted); border-radius:8px; font-family:var(--font-sans); font-size:13px; cursor:pointer;">{copied ? 'Copied!' : 'Share'}</button>
  </div>

  <!-- EPG schedule -->
  {#if loaded && programs.length > 0}
    <h3 style="font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--color-text-dim); margin:0 0 12px;">On now & next</h3>
    <div style="display:flex; flex-direction:column; gap:8px;">
      {#each programs as prog}
        <div style="display:flex; gap:12px; padding:10px 12px; background:var(--color-surface-raised); border-radius:8px;">
          <div style="font-size:12px; color:var(--color-text-dim); white-space:nowrap; margin-top:2px;">{formatTime(prog.start)}</div>
          <div style="flex:1; min-width:0;">
            <div style="font-size:14px; font-weight:600; color:var(--color-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{prog.title}</div>
            {#if prog.description}
              <div style="font-size:12px; color:var(--color-text-muted); margin-top:2px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">{prog.description}</div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else if loaded}
    <p style="font-size:13px; color:var(--color-text-dim);">No schedule available</p>
  {/if}
</div>
