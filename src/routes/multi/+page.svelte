<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { attachHls } from '$lib/hls.js';
import { acquireWakeLock } from '$lib/utils/mobile.js';
import type { HlsHandle } from '$lib/hls.js';
import type { Channel } from '$lib/types.js';

type Tile = { channel: Channel | null; hls: HlsHandle | null };

let tiles = $state<Tile[]>([
	{ channel: null, hls: null },
	{ channel: null, hls: null },
	{ channel: null, hls: null },
	{ channel: null, hls: null },
]);
let activeIndex = $state(0);
let videoEls = $state<(HTMLVideoElement | null)[]>([null, null, null, null]);
let wakeLock = $state<{ release(): void } | null>(null);
let searchQuery = $state('');
let searchResults = $state<Channel[]>([]);
let pickingTile = $state<number | null>(null);
let searchLoading = $state(false);

async function search(q: string) {
	if (!q.trim()) {
		searchResults = [];
		return;
	}
	searchLoading = true;
	try {
		const res = await fetch(`/api/channels?q=${encodeURIComponent(q)}`);
		const data = await res.json() as { channels?: Channel[] };
		searchResults = data.channels ?? [];
	} finally {
		searchLoading = false;
	}
}

let searchTimer: ReturnType<typeof setTimeout> | null = null;
function onSearchInput(q: string) {
	searchQuery = q;
	if (searchTimer) clearTimeout(searchTimer);
	searchTimer = setTimeout(() => search(q), 250);
}

async function addToTile(tileIdx: number, ch: Channel) {
	tiles[tileIdx].hls?.destroy();
	const el = videoEls[tileIdx];
	if (!el) return;

	const stream = ch.streams[0];
	if (!stream) return;

	const handle = await attachHls(
		el,
		stream.url,
		() => {},
		() => {
			tiles[tileIdx] = { ...tiles[tileIdx], hls: null };
		},
	);
	tiles = tiles.map((t, i) => (i === tileIdx ? { channel: ch, hls: handle } : t));
	pickingTile = null;
	searchQuery = '';
	searchResults = [];
}

function setActive(idx: number) {
	activeIndex = idx;
	videoEls.forEach((el, i) => {
		if (el) el.muted = i !== idx;
	});
}

function closePicker() {
	pickingTile = null;
	searchQuery = '';
	searchResults = [];
}

function removeTile(idx: number) {
	tiles[idx].hls?.destroy();
	tiles = tiles.map((t, i) => (i === idx ? { channel: null, hls: null } : t));
}

onMount(async () => {
	videoEls.forEach((el, i) => {
		if (el) el.muted = i !== activeIndex;
	});
	wakeLock = await acquireWakeLock();
});

onDestroy(() => {
	tiles.forEach((t) => t.hls?.destroy());
	wakeLock?.release();
	if (searchTimer) clearTimeout(searchTimer);
});
</script>

<div class="bg-mesh" style="min-height: 100vh; display: flex; flex-direction: column;">
	<header class="glass-header sticky top-0 z-30" style="padding: 10px 16px; flex-shrink: 0;">
		<div style="display: flex; align-items: center; gap: 16px;">
			<a
				href="/"
				style="color: var(--color-text-muted); text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; transition: color 0.15s;"
				onmouseenter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
				onmouseleave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
			>
				← dtv
			</a>
			<h1 style="margin: 0; font-size: clamp(1rem, 2.5vw, 1.3rem); font-weight: 900; letter-spacing: -0.03em; color: var(--color-text);">
				Multi-view
			</h1>
			<span style="font-size: 12px; color: var(--color-text-dim); margin-left: auto;">
				{tiles.filter((t) => t.channel).length} / 4 active
			</span>
		</div>
	</header>

	<!-- 2×2 grid -->
	<div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 2px; min-height: 0; height: calc(100vh - 49px);">
		{#each tiles as tile, i}
			<div
				style="position: relative; background: var(--color-surface); overflow: hidden; border: 2px solid {activeIndex === i && tile.channel ? 'oklch(0.75 0 0 / 0.5)' : 'transparent'}; transition: border-color 0.15s;"
			>
				{#if tile.channel}
					<!-- Video element -->
					<video
						bind:this={videoEls[i]}
						autoplay
						playsinline
						muted={i !== activeIndex}
						style="width: 100%; height: 100%; object-fit: cover; display: block;"
					></video>

					<!-- Overlay controls -->
					<div
						class="tile-overlay"
						style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%); display: flex; flex-direction: column; justify-content: flex-end; padding: 10px; opacity: 0; transition: opacity 0.2s;"
						onmouseenter={(e) => (e.currentTarget.style.opacity = '1')}
						onmouseleave={(e) => (e.currentTarget.style.opacity = '0')}
					>
						<p style="margin: 0 0 8px; font-size: 13px; font-weight: 700; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
							{tile.channel.countryFlag} {tile.channel.name}
						</p>
						<div style="display: flex; gap: 6px;">
							{#if i !== activeIndex}
								<button
									onclick={() => setActive(i)}
									style="padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: #fff; font-family: var(--font-sans); font-size: 11px; font-weight: 700; cursor: pointer; backdrop-filter: blur(4px);"
								>
									Set audio
								</button>
							{:else}
								<span style="padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.15); color: #fff; font-family: var(--font-sans); font-size: 11px; font-weight: 700; letter-spacing: 0.04em;">
									AUDIO
								</span>
							{/if}
							<button
								onclick={() => (pickingTile = i)}
								style="padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: #fff; font-family: var(--font-sans); font-size: 11px; font-weight: 700; cursor: pointer; backdrop-filter: blur(4px);"
							>
								Change
							</button>
							<button
								onclick={() => removeTile(i)}
								style="padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: rgba(255,255,255,0.6); font-family: var(--font-sans); font-size: 11px; font-weight: 700; cursor: pointer; backdrop-filter: blur(4px);"
							>
								✕
							</button>
						</div>
					</div>
				{:else}
					<!-- Empty tile -->
					<button
						onclick={() => (pickingTile = i)}
						style="width: 100%; height: 100%; background: none; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--color-text-dim); transition: background 0.15s;"
						onmouseenter={(e) => (e.currentTarget.style.background = 'var(--color-surface-raised)')}
						onmouseleave={(e) => (e.currentTarget.style.background = 'none')}
					>
						<span style="font-size: 32px; font-weight: 200; color: var(--color-border); line-height: 1;">+</span>
						<span style="font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--color-text-dim);">Add channel</span>
					</button>
				{/if}
			</div>
		{/each}
	</div>
</div>

<!-- Channel picker modal -->
{#if pickingTile !== null}
	<div
		class="glass-overlay"
		style="position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px;"
		onclick={(e) => { if (e.target === e.currentTarget) closePicker(); }}
		role="dialog"
		aria-modal="true"
		aria-label="Pick a channel"
	>
		<div
			class="glass-dark-menu"
			style="width: 100%; max-width: 480px; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden;"
		>
			<!-- Modal header -->
			<div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 12px; border-bottom: 1px solid rgba(255,255,255,0.06);">
				<p style="margin: 0; font-size: 14px; font-weight: 700; color: var(--color-text); letter-spacing: -0.01em;">
					Pick a channel
				</p>
				<button
					onclick={closePicker}
					style="background: none; border: none; color: var(--color-text-dim); font-size: 18px; cursor: pointer; line-height: 1; padding: 2px 6px; border-radius: 4px; transition: color 0.15s;"
					onmouseenter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
					onmouseleave={(e) => (e.currentTarget.style.color = 'var(--color-text-dim)')}
				>
					✕
				</button>
			</div>

			<!-- Search input -->
			<div style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06);">
				<input
					type="search"
					value={searchQuery}
					oninput={(e) => onSearchInput(e.currentTarget.value)}
					placeholder="Search channels…"
					autofocus
					style="width: 100%; background: rgba(255,255,255,0.05); color: var(--color-text); border: 1px solid var(--color-border); border-radius: 6px; padding: 9px 12px; font-family: var(--font-sans); font-size: 14px; outline: none; transition: border-color 0.15s;"
					onfocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-text-muted)')}
					onblur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
				/>
			</div>

			<!-- Results -->
			<div style="overflow-y: auto; flex: 1;">
				{#if searchLoading}
					<div style="padding: 24px 16px; text-align: center;">
						<p style="margin: 0; font-size: 13px; color: var(--color-text-dim);">Searching…</p>
					</div>
				{:else if searchQuery && searchResults.length === 0}
					<div style="padding: 24px 16px; text-align: center;">
						<p style="margin: 0; font-size: 13px; color: var(--color-text-dim);">No channels found for "{searchQuery}"</p>
					</div>
				{:else if !searchQuery}
					<div style="padding: 24px 16px; text-align: center;">
						<p style="margin: 0; font-size: 13px; color: var(--color-text-dim);">Type to search channels</p>
					</div>
				{:else}
					{#each searchResults.slice(0, 50) as ch (ch.id)}
						<button
							onclick={() => addToTile(pickingTile!, ch)}
							style="width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: none; border: none; border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; text-align: left; transition: background 0.1s;"
							onmouseenter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
							onmouseleave={(e) => (e.currentTarget.style.background = 'none')}
						>
							{#if ch.logo}
								<img
									src={ch.logo}
									alt=""
									style="width: 28px; height: 28px; object-fit: contain; border-radius: 4px; flex-shrink: 0; background: var(--color-surface-raised);"
									onerror={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
								/>
							{:else}
								<div style="width: 28px; height: 28px; border-radius: 4px; background: var(--color-surface-raised); flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
									<span style="font-size: 14px;">{ch.countryFlag}</span>
								</div>
							{/if}
							<div style="min-width: 0; flex: 1;">
								<p style="margin: 0; font-size: 13px; font-weight: 700; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{ch.name}</p>
								{#if ch.categories.length > 0}
									<p style="margin: 2px 0 0; font-size: 11px; color: var(--color-text-dim);">{ch.categories[0]}</p>
								{/if}
							</div>
							<span style="font-size: 11px; color: var(--color-text-dim); flex-shrink: 0;">
								{ch.streams.length} stream{ch.streams.length !== 1 ? 's' : ''}
							</span>
						</button>
					{/each}
					{#if searchResults.length > 50}
						<p style="padding: 10px 16px; margin: 0; font-size: 12px; color: var(--color-text-dim); text-align: center;">
							Showing 50 of {searchResults.length} — refine your search
						</p>
					{/if}
				{/if}
			</div>
		</div>
	</div>
{/if}
