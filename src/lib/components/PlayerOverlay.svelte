<script lang="ts">
import { focusTrap } from '$lib/actions/focusTrap.js';
import type { Channel } from '$lib/types.js';
import type { WakeLockHandle } from '$lib/utils/mobile.js';
import {
	acquireWakeLock,
	isFullscreen,
	lockLandscape,
	requestFullscreen,
	unlockOrientation,
	vibrate,
} from '$lib/utils/mobile.js';
import EpgStrip from './EpgStrip.svelte';

type HlsConstructor = typeof import('hls.js').default;
type HlsInstance = InstanceType<HlsConstructor>;
let HlsCtor: HlsConstructor | null = null;
let hls: HlsInstance | null = null;

async function ensureHls(): Promise<HlsConstructor | null> {
	if (HlsCtor) return HlsCtor;
	HlsCtor = (await import('hls.js')).default;
	return HlsCtor;
}

type Props = {
	channel: Channel;
	onclose: () => void;
	onnext: () => void;
	onprev: () => void;
	onfavorite: (id: string) => void;
	isFavorite: boolean;
	hasNext?: boolean;
	hasPrev?: boolean;
};

let {
	channel,
	onclose,
	onnext,
	onprev,
	onfavorite,
	isFavorite,
	hasNext = true,
	hasPrev = true,
}: Props = $props();

let overlayEl: HTMLDivElement;
let videoEl: HTMLVideoElement;
let streamIndex = $state(0);
let status = $state<'loading' | 'playing' | 'error' | 'failed'>('loading');
let chromeVisible = $state(true);
let fullscreen = $state(false);
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let wakeLock: WakeLockHandle | null = null;

let paused = $state(false);
let muted = $state(false);
let volume = $state(1);

// touch tracking
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let touchStartVol = 0;
let isSeeking = $state(false);
let volumeIndicator = $state<number | null>(null);
let volIndicatorTimer: ReturnType<typeof setTimeout> | null = null;
let swipeHint = $state<'left' | 'right' | null>(null);

const activeStream = $derived(channel.streams[streamIndex] ?? null);

// ── Playback ──────────────────────────────────────────────────────────────

async function loadStream(idx: number) {
	const stream = channel.streams[idx];
	if (!stream) {
		status = 'failed';
		return;
	}
	status = 'loading';
	streamIndex = idx;
	hls?.destroy();
	hls = null;

	if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
		videoEl.src = stream.url;
		try {
			await videoEl.play();
			status = 'playing';
			paused = false;
		} catch {
			if (idx + 1 < channel.streams.length) {
				loadStream(idx + 1);
				return;
			}
			status = 'failed';
		}
		return;
	}

	const H = await ensureHls();
	if (!H) {
		status = 'failed';
		return;
	}

	if (H.isSupported()) {
		hls = new H({ enableWorker: true, lowLatencyMode: true });
		hls.loadSource(stream.url);
		hls.attachMedia(videoEl);
		hls.on(H.Events.MANIFEST_PARSED, () => {
			videoEl.play().catch(() => {});
			status = 'playing';
			paused = false;
		});
		hls.on(H.Events.ERROR, (_evt: unknown, data: { fatal: boolean }) => {
			if (data.fatal) {
				if (streamIndex + 1 < channel.streams.length)
					loadStream(streamIndex + 1);
				else status = 'failed';
			}
		});
	} else {
		status = 'failed';
	}
}

$effect(() => {
	if (!videoEl) return;
	loadStream(0);
	acquireWakeLock().then((h) => {
		wakeLock = h;
	});

	function onVideoPlay() {
		paused = false;
	}
	function onVideoPause() {
		paused = true;
	}
	function onVideoVolumeChange() {
		volume = videoEl.volume;
		muted = videoEl.muted;
	}

	videoEl.addEventListener('play', onVideoPlay);
	videoEl.addEventListener('pause', onVideoPause);
	videoEl.addEventListener('volumechange', onVideoVolumeChange);

	return () => {
		videoEl.removeEventListener('play', onVideoPlay);
		videoEl.removeEventListener('pause', onVideoPause);
		videoEl.removeEventListener('volumechange', onVideoVolumeChange);
		hls?.destroy();
		hls = null;
		wakeLock?.release();
		if (fullscreen && isFullscreen())
			document.exitFullscreen?.().catch(() => {});
		unlockOrientation();
	};
});

let channelIdHistory = $state<string[]>([]);
$effect(() => {
	const id = channel.id;
	const last = channelIdHistory[channelIdHistory.length - 1];
	if (id !== last) {
		channelIdHistory = [...channelIdHistory, id];
		if (channelIdHistory.length > 1 && videoEl) {
			streamIndex = 0;
			paused = false;
			loadStream(0);
		}
	}
});

// ── Chrome auto-hide ──────────────────────────────────────────────────────

function scheduleChromeHide(delay = 4000) {
	if (hideTimer) clearTimeout(hideTimer);
	hideTimer = setTimeout(() => {
		chromeVisible = false;
	}, delay);
}

function showChrome(autoHide = true) {
	chromeVisible = true;
	if (autoHide) scheduleChromeHide();
}

$effect(() => {
	scheduleChromeHide();
	return () => {
		if (hideTimer) clearTimeout(hideTimer);
	};
});

// ── Fullscreen ────────────────────────────────────────────────────────────

async function toggleFullscreen() {
	await requestFullscreen(overlayEl);
	fullscreen = isFullscreen();
	if (fullscreen) {
		await lockLandscape();
	} else {
		unlockOrientation();
	}
}

function handleFullscreenChange() {
	fullscreen = isFullscreen();
	if (!fullscreen) unlockOrientation();
}

// ── Playback controls ─────────────────────────────────────────────────────

function togglePause() {
	if (!videoEl) return;
	if (videoEl.paused) {
		videoEl.play().catch(() => {});
	} else {
		videoEl.pause();
	}
	showChrome();
}

function toggleMute() {
	if (!videoEl) return;
	videoEl.muted = !videoEl.muted;
	showChrome();
}

function adjustVolume(delta: number) {
	if (!videoEl) return;
	videoEl.volume = Math.max(0, Math.min(1, videoEl.volume + delta));
	showChrome();
}

async function requestPiP() {
	if (!videoEl) return;
	try {
		if (document.pictureInPictureElement) {
			await document.exitPictureInPicture();
		} else {
			await videoEl.requestPictureInPicture();
		}
	} catch {
		/* not supported */
	}
}

// ── Touch gestures ────────────────────────────────────────────────────────

const SWIPE_THRESHOLD = 55;
const TAP_MAX_MOVE = 12;
const TAP_MAX_MS = 300;

function handleTouchStart(e: TouchEvent) {
	const t = e.touches[0];
	touchStartX = t.clientX;
	touchStartY = t.clientY;
	touchStartTime = Date.now();
	touchStartVol = videoEl?.volume ?? 1;
	isSeeking = false;
}

function handleTouchMove(e: TouchEvent) {
	const t = e.touches[0];
	const dx = t.clientX - touchStartX;
	const dy = t.clientY - touchStartY;

	// Vertical swipe on right half = volume
	if (
		Math.abs(dy) > 20 &&
		Math.abs(dy) > Math.abs(dx) * 1.5 &&
		touchStartX > window.innerWidth * 0.5
	) {
		e.preventDefault();
		isSeeking = true;
		const deltaVol = -(dy / 150);
		const newVol = Math.max(0, Math.min(1, touchStartVol + deltaVol));
		if (videoEl) videoEl.volume = newVol;
		volumeIndicator = Math.round(newVol * 100);
		if (volIndicatorTimer) clearTimeout(volIndicatorTimer);
		volIndicatorTimer = setTimeout(() => {
			volumeIndicator = null;
		}, 1200);
	}

	// Horizontal swipe hint
	if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 1.5) {
		swipeHint = dx < 0 ? 'left' : 'right';
	} else {
		swipeHint = null;
	}
}

function handleTouchEnd(e: TouchEvent) {
	const t = e.changedTouches[0];
	const dx = t.clientX - touchStartX;
	const dy = t.clientY - touchStartY;
	const dt = Date.now() - touchStartTime;
	swipeHint = null;

	if (isSeeking) {
		isSeeking = false;
		return;
	}

	const moved = Math.hypot(dx, dy);

	// Tap — toggle chrome
	if (moved < TAP_MAX_MOVE && dt < TAP_MAX_MS) {
		if (chromeVisible) {
			chromeVisible = false;
			if (hideTimer) clearTimeout(hideTimer);
		} else {
			showChrome();
		}
		return;
	}

	// Horizontal swipe — channel zap
	if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
		vibrate(18);
		if (dx < 0) {
			onnext();
		} else {
			onprev();
		}
	}
}

// ── Keyboard ──────────────────────────────────────────────────────────────

function handleKeydown(e: KeyboardEvent) {
	switch (e.key) {
		case 'Escape':
			if (fullscreen && isFullscreen()) {
				document.exitFullscreen?.();
				return;
			}
			onclose();
			break;
		case 'ArrowLeft':
			e.preventDefault();
			showChrome();
			onprev();
			break;
		case 'ArrowRight':
			e.preventDefault();
			showChrome();
			onnext();
			break;
		case 'ArrowUp':
			e.preventDefault();
			adjustVolume(0.1);
			break;
		case 'ArrowDown':
			e.preventDefault();
			adjustVolume(-0.1);
			break;
		case 'f':
		case 'F':
			onfavorite(channel.id);
			break;
		case 'm':
		case 'M':
			toggleMute();
			break;
		case ' ':
			e.preventDefault();
			togglePause();
			break;
	}
}

function qualityLabel(): string {
	if (!activeStream) return '';
	if (activeStream.quality) return activeStream.quality.toUpperCase();
	if (activeStream.label) return activeStream.label;
	return `${streamIndex + 1}/${channel.streams.length}`;
}
</script>

<svelte:window onkeydown={handleKeydown} onfullscreenchange={handleFullscreenChange} />

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	bind:this={overlayEl}
	class="overlay"
	role="dialog"
	aria-label="Video player"
	aria-modal="true"
	tabindex="-1"
	use:focusTrap
	onmousemove={() => showChrome()}
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
>
	<video
		bind:this={videoEl}
		class="video"
		playsinline
		autoplay
		muted={false}
	></video>

	<!-- Volume indicator -->
	{#if volumeIndicator !== null}
		<div class="vol-indicator" aria-live="polite" aria-atomic="true">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				{#if volumeIndicator === 0}
					<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
				{:else if volumeIndicator < 50}
					<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
				{:else}
					<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
				{/if}
			</svg>
			<span>{volumeIndicator}%</span>
			<div class="vol-bar">
				<div class="vol-fill" style="width:{volumeIndicator}%"></div>
			</div>
		</div>
	{/if}

	<!-- Swipe hint arrows -->
	{#if swipeHint === 'left'}
		<div class="swipe-hint right" aria-hidden="true">
			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
			<span>Next</span>
		</div>
	{:else if swipeHint === 'right'}
		<div class="swipe-hint left" aria-hidden="true">
			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
			<span>Prev</span>
		</div>
	{/if}

	{#if status === 'loading'}
		<div class="status-layer" aria-live="polite">
			<div class="spinner" aria-hidden="true"></div>
			<span class="status-text">Loading stream…</span>
		</div>
	{/if}

	{#if status === 'failed'}
		<div class="status-layer failed" aria-live="assertive">
			<p class="failed-title">No streams available</p>
			<p class="failed-sub">All {channel.streams.length} stream{channel.streams.length !== 1 ? 's' : ''} for {channel.name} failed to load.</p>
			<button class="close-btn-inline" onclick={onclose}>Close</button>
		</div>
	{/if}

	<!-- Tap-to-toggle hint shown briefly when chrome hides -->

	<!-- Bottom chrome -->
	<div
		class="chrome"
		class:hidden={!chromeVisible}
		role="group"
		aria-label="Player controls"
		onmouseenter={() => { chromeVisible = true; if (hideTimer) clearTimeout(hideTimer); }}
		onmouseleave={() => scheduleChromeHide()}
		ontouchstart={(e) => { e.stopPropagation(); chromeVisible = true; if (hideTimer) clearTimeout(hideTimer); }}
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
				<button class="ctrl-btn" aria-label="Previous channel" disabled={!hasPrev} onclick={onprev}>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="15 18 9 12 15 6"/>
					</svg>
				</button>

				<button class="ctrl-btn" aria-label={paused ? 'Play' : 'Pause'} onclick={togglePause}>
					{#if paused}
						<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
					{:else}
						<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
					{/if}
				</button>

				<button class="ctrl-btn" aria-label="Next channel" disabled={!hasNext} onclick={onnext}>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="9 18 15 12 9 6"/>
					</svg>
				</button>

				<button class="ctrl-btn" aria-label={muted || volume === 0 ? 'Unmute' : 'Mute'} onclick={toggleMute}>
					{#if muted || volume === 0}
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
					{:else if volume < 0.5}
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
					{:else}
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
					{/if}
				</button>

				<input
					type="range"
					class="vol-slider"
					min="0" max="1" step="0.05"
					value={volume}
					oninput={(e) => { if (videoEl) videoEl.volume = parseFloat((e.currentTarget as HTMLInputElement).value); showChrome(); }}
					aria-label="Volume"
				/>

				{#if 'pictureInPictureEnabled' in document}
					<button class="ctrl-btn" aria-label="Picture in picture" onclick={requestPiP}>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><rect x="12" y="11" width="8" height="6" rx="1"/></svg>
					</button>
				{/if}

				<button
					class="ctrl-btn"
					class:fav-active={isFavorite}
					aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
					onclick={() => { onfavorite(channel.id); vibrate(10); }}
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2">
						<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
					</svg>
				</button>

				<button class="ctrl-btn" aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} onclick={toggleFullscreen}>
					{#if fullscreen}
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 0 2-2h3M3 16h3a2 2 0 0 0 2 2v3"/>
						</svg>
					{:else}
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
						</svg>
					{/if}
				</button>

				<button class="ctrl-btn close-ctrl" aria-label="Close player" onclick={onclose}>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
				</button>
			</div>
		</div>
	</div>

	<!-- Mobile tap-zone hint: tap = show/hide chrome -->
	<div class="tap-hint" class:visible={!chromeVisible} aria-hidden="true">
		Tap to show controls
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
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
	}

	.video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		background: black;
	}

	/* ── Status layers ── */
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
		background: rgba(0, 0, 0, 0.80);
	}

	.spinner {
		width: 36px;
		height: 36px;
		border: 2px solid oklch(0.25 0 0);
		border-top-color: var(--color-text-muted);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin { to { transform: rotate(360deg); } }

	.status-text {
		font-size: 14px;
		color: var(--color-text-muted);
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	.failed-title {
		font-size: clamp(1.25rem, 5vw, 2rem);
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
		padding: 10px 28px;
		border-radius: 8px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font-family: var(--font-sans);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
	}

	.close-btn-inline:hover, .close-btn-inline:active { background: var(--color-surface-raised); }

	/* ── Volume indicator ── */
	.vol-indicator {
		position: absolute;
		top: 50%;
		right: 20px;
		transform: translateY(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		z-index: 30;
		color: white;
		font-size: 13px;
		font-weight: 700;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border-radius: 12px;
		padding: 12px 14px;
		pointer-events: none;
		min-width: 64px;
	}

	.vol-bar {
		width: 48px;
		height: 3px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 2px;
		overflow: hidden;
	}

	.vol-fill {
		height: 100%;
		background: white;
		border-radius: 2px;
		transition: width 0.05s;
	}

	/* ── Swipe hint ── */
	.swipe-hint {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		z-index: 30;
		color: rgba(255, 255, 255, 0.7);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.08em;
		pointer-events: none;
		animation: hint-fade 0.15s ease-out;
	}

	.swipe-hint.left { left: 24px; }
	.swipe-hint.right { right: 24px; }

	@keyframes hint-fade {
		from { opacity: 0; transform: translateY(-50%) scale(0.85); }
		to { opacity: 1; transform: translateY(-50%) scale(1); }
	}

	/* ── Chrome ── */
	.chrome {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 20;
		transition: opacity 0.25s, transform 0.25s;
	}

	.chrome.hidden {
		opacity: 0;
		transform: translateY(6px);
		pointer-events: none;
	}

	.chrome-inner {
		padding: 20px 20px 24px;
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
		font-size: clamp(1.1rem, 4vw, 2rem);
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

	.flag { font-size: 16px; line-height: 1; }

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
		width: 44px;
		height: 44px;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: rgba(255, 255, 255, 0.06);
		color: var(--color-text-muted);
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
		padding: 0;
		-webkit-tap-highlight-color: transparent;
	}

	.ctrl-btn:hover, .ctrl-btn:active {
		background: rgba(255, 255, 255, 0.14);
		color: var(--color-text);
	}

	.ctrl-btn:disabled {
		opacity: 0.3;
		cursor: default;
		pointer-events: none;
	}

	.ctrl-btn.fav-active { color: var(--color-live); }
	.close-ctrl { margin-left: 4px; }

	.vol-slider {
		width: 80px;
		height: 3px;
		accent-color: var(--color-text);
		cursor: pointer;
		flex-shrink: 0;
	}

	/* ── Tap hint ── */
	.tap-hint {
		position: absolute;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.08em;
		color: rgba(255, 255, 255, 0.35);
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.4s;
	}

	.tap-hint.visible { opacity: 1; }

	/* ── Mobile overrides ── */
	@media (max-width: 600px) {
		.chrome-inner {
			flex-direction: column;
			align-items: flex-start;
			padding: 14px 16px 20px;
			gap: 12px;
		}

		.controls {
			align-self: stretch;
			justify-content: space-between;
		}

		.ctrl-btn {
			flex: 1;
			height: 48px;
			border-radius: 10px;
		}

		.channel-name {
			font-size: clamp(1rem, 5vw, 1.5rem);
		}

		.vol-slider { display: none; }
	}

	@media (max-height: 500px) and (orientation: landscape) {
		.chrome-inner {
			padding: 10px 20px 14px;
		}
	}

	/* ── Reduced motion ── */
	@media (prefers-reduced-motion: reduce) {
		.spinner { animation: none; border-top-color: var(--color-text); }
		.chrome { transition: none; }
		.tap-hint { transition: none; }
	}
</style>
