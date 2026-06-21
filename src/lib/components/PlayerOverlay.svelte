<script lang="ts">
	import Hls from 'hls.js';
	import type { Channel } from '$lib/types.js';
	import EpgStrip from './EpgStrip.svelte';

	type Props = {
		channel: Channel;
		onclose: () => void;
		onnext: () => void;
		onprev: () => void;
		onfavorite: (id: string) => void;
		isFavorite: boolean;
	};

	let { channel, onclose, onnext, onprev, onfavorite, isFavorite }: Props = $props();

	let videoEl: HTMLVideoElement;
	let hls: Hls | null = null;
	let streamIndex = $state(0);
	let status = $state<'loading' | 'playing' | 'error' | 'failed'>('loading');
	let chromeVisible = $state(true);
	let hideTimer: ReturnType<typeof setTimeout> | null = null;

	const activeStream = $derived(channel.streams[streamIndex] ?? null);

	function loadStream(idx: number) {
		const stream = channel.streams[idx];
		if (!stream) {
			status = 'failed';
			return;
		}

		status = 'loading';
		streamIndex = idx;

		hls?.destroy();
		hls = null;

		if (Hls.isSupported()) {
			hls = new Hls({ enableWorker: true, lowLatencyMode: true });
			hls.loadSource(stream.url);
			hls.attachMedia(videoEl);
			hls.on(Hls.Events.MANIFEST_PARSED, () => {
				videoEl.play().catch(() => {});
				status = 'playing';
			});
			hls.on(Hls.Events.ERROR, (_evt, data) => {
				if (data.fatal) {
					if (streamIndex + 1 < channel.streams.length) {
						loadStream(streamIndex + 1);
					} else {
						status = 'failed';
					}
				}
			});
		} else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
			videoEl.src = stream.url;
			videoEl
				.play()
				.then(() => {
					status = 'playing';
				})
				.catch(() => {
					if (streamIndex + 1 < channel.streams.length) {
						loadStream(streamIndex + 1);
					} else {
						status = 'failed';
					}
				});
		} else {
			status = 'failed';
		}
	}

	$effect(() => {
		if (!videoEl) return;
		loadStream(0);
		return () => {
			hls?.destroy();
			hls = null;
		};
	});

	let channelIdHistory = $state<string[]>([]);

	$effect(() => {
		const id = channel.id;
		const last = channelIdHistory[channelIdHistory.length - 1];
		if (id !== last) {
			channelIdHistory = [...channelIdHistory, id];
			if (channelIdHistory.length > 1) {
				streamIndex = 0;
				if (videoEl) loadStream(0);
			}
		}
	});

	function scheduleChromeHide() {
		if (hideTimer) clearTimeout(hideTimer);
		hideTimer = setTimeout(() => {
			chromeVisible = false;
		}, 3000);
	}

	function showChrome() {
		chromeVisible = true;
		scheduleChromeHide();
	}

	$effect(() => {
		scheduleChromeHide();
		return () => {
			if (hideTimer) clearTimeout(hideTimer);
		};
	});

	function handleMousemove() {
		showChrome();
	}

	function handleBottomEnter() {
		chromeVisible = true;
		if (hideTimer) clearTimeout(hideTimer);
	}

	function handleBottomLeave() {
		scheduleChromeHide();
	}

	function handleKeydown(e: KeyboardEvent) {
		switch (e.key) {
			case 'Escape':
				onclose();
				break;
			case 'ArrowLeft':
				e.preventDefault();
				onprev();
				break;
			case 'ArrowRight':
				e.preventDefault();
				onnext();
				break;
			case 'f':
			case 'F':
				onfavorite(channel.id);
				break;
		}
	}

	function qualityLabel(): string {
		if (!activeStream) return '';
		if (activeStream.quality) return activeStream.quality.toUpperCase();
		if (activeStream.label) return activeStream.label;
		return `Stream ${streamIndex + 1}`;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="overlay"
	role="dialog"
	aria-label="Video player"
	aria-modal="true"
	tabindex="-1"
	onmousemove={handleMousemove}
>
	<video
		bind:this={videoEl}
		class="video"
		playsinline
		autoplay
		muted={false}
	></video>

	{#if status === 'loading'}
		<div class="status-layer" aria-live="polite">
			<div class="spinner" aria-hidden="true"></div>
			<span class="status-text">Loading stream...</span>
		</div>
	{/if}

	{#if status === 'error'}
		<div class="status-layer" aria-live="polite">
			<span class="status-text">Stream unavailable — trying next...</span>
		</div>
	{/if}

	{#if status === 'failed'}
		<div class="status-layer failed" aria-live="assertive">
			<p class="failed-title">No streams available</p>
			<p class="failed-sub">All {channel.streams.length} stream{channel.streams.length !== 1 ? 's' : ''} for {channel.name} failed to load.</p>
			<button class="close-btn-inline" onclick={onclose}>Close</button>
		</div>
	{/if}

	<div
		class="chrome"
		class:hidden={!chromeVisible}
		role="toolbar"
		aria-label="Player controls"
		tabindex="-1"
		onmouseenter={handleBottomEnter}
		onmouseleave={handleBottomLeave}
	>
		<div class="glass-dark chrome-inner">
			<div class="channel-info">
				<div class="name-row">
					<span class="channel-name">{channel.name}</span>
					{#if status === 'playing'}
						<span class="live-badge">
							<span class="live-dot"></span>
							LIVE
						</span>
					{/if}
				</div>

				<div class="meta-row">
					<span class="flag">{channel.countryFlag}</span>
					{#if channel.categories.length > 0}
						<span class="quality-badge">{channel.categories[0]}</span>
					{/if}
					{#if activeStream && qualityLabel()}
						<span class="quality-badge">{qualityLabel()}</span>
					{/if}
				</div>

				<EpgStrip channelId={channel.id} />
			</div>

			<div class="controls">
				<button
					class="ctrl-btn"
					aria-label="Previous channel"
					onclick={onprev}
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="15 18 9 12 15 6"/>
					</svg>
				</button>

				<button
					class="ctrl-btn"
					class:fav-active={isFavorite}
					aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
					onclick={() => onfavorite(channel.id)}
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2">
						<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
					</svg>
				</button>

				<button
					class="ctrl-btn"
					aria-label="Next channel"
					onclick={onnext}
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="9 18 15 12 9 6"/>
					</svg>
				</button>

				<button
					class="ctrl-btn close-ctrl"
					aria-label="Close player"
					onclick={onclose}
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"/>
						<line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: black;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		background: black;
	}

	.status-layer {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		z-index: 10;
		pointer-events: none;
	}

	.status-layer.failed {
		pointer-events: auto;
		background: rgba(0, 0, 0, 0.75);
	}

	.spinner {
		width: 36px;
		height: 36px;
		border: 2px solid oklch(0.25 0 0);
		border-top-color: var(--color-text-muted);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.status-text {
		font-size: 14px;
		color: var(--color-text-muted);
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	.failed-title {
		font-size: clamp(1.25rem, 3vw, 2rem);
		font-weight: 900;
		color: var(--color-text);
		letter-spacing: -0.02em;
		margin: 0;
	}

	.failed-sub {
		font-size: 14px;
		color: var(--color-text-muted);
		margin: 0;
		text-align: center;
		max-width: 320px;
	}

	.close-btn-inline {
		margin-top: 8px;
		padding: 8px 24px;
		border-radius: 6px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font-family: var(--font-sans);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
	}

	.close-btn-inline:hover {
		background: var(--color-surface-raised);
	}

	.chrome {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 20;
		transition: opacity 0.3s, transform 0.3s;
	}

	.chrome.hidden {
		opacity: 0;
		transform: translateY(8px);
		pointer-events: none;
	}

	.chrome-inner {
		padding: 20px 24px 24px;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 16px;
	}

	.channel-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
		flex: 1;
	}

	.name-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.channel-name {
		font-size: clamp(1.25rem, 3.5vw, 2rem);
		font-weight: 900;
		color: var(--color-text);
		letter-spacing: -0.03em;
		line-height: 1.1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.live-badge {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: var(--color-live);
		flex-shrink: 0;
	}

	.meta-row {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.flag {
		font-size: 16px;
		line-height: 1;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-shrink: 0;
	}

	.ctrl-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: rgba(255, 255, 255, 0.06);
		color: var(--color-text-muted);
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
		padding: 0;
	}

	.ctrl-btn:hover {
		background: rgba(255, 255, 255, 0.12);
		color: var(--color-text);
	}

	.ctrl-btn.fav-active {
		color: var(--color-live);
	}

	.close-ctrl {
		margin-left: 8px;
	}

	@media (max-width: 480px) {
		.chrome-inner {
			flex-direction: column;
			align-items: flex-start;
			padding: 16px;
		}

		.controls {
			align-self: flex-end;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
			border-top-color: var(--color-text);
		}

		.chrome {
			transition: none;
		}
	}
</style>
