<script lang="ts">
	import type { Channel } from '$lib/types.js';

	type Props = {
		channel: Channel;
		watching: boolean;
		isFavorite: boolean;
		onclick: () => void;
		onfavorite: () => void;
	};

	let { channel, watching, isFavorite, onclick, onfavorite }: Props = $props();

	let imgFailed = $state(false);

	const initials = $derived(
		channel.name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((w) => w[0].toUpperCase())
			.join('')
	);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onclick();
		}
	}

	function handleFavorite(e: MouseEvent) {
		e.stopPropagation();
		onfavorite();
	}

	function handleFavoriteKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.stopPropagation();
			e.preventDefault();
			onfavorite();
		}
	}
</script>

<div
	role="button"
	tabindex="0"
	class="channel-card"
	class:watching
	onclick={onclick}
	onkeydown={handleKeydown}
>
	<div class="logo-wrap">
		{#if channel.logo && !imgFailed}
			<img
				src={channel.logo}
				alt={channel.name}
				loading="lazy"
				onerror={() => (imgFailed = true)}
			/>
		{:else}
			<div class="channel-initials" style="width:100%;height:100%;">
				{initials}
			</div>
		{/if}
	</div>

	<div class="meta">
		<span class="name">{channel.name}</span>
		<div class="row">
			<span class="flag">{channel.countryFlag}</span>
			<span class="stream-count">{channel.streams.length} stream{channel.streams.length !== 1 ? 's' : ''}</span>
		</div>
		{#if channel.categories[0]}
			<span class="quality-badge" style="margin-top:4px;">{channel.categories[0]}</span>
		{/if}
	</div>

	<button
		class="fav-btn"
		class:active={isFavorite}
		aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
		onclick={handleFavorite}
		onkeydown={handleFavoriteKeydown}
		tabindex="0"
	>
		<svg width="14" height="14" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2">
			<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
		</svg>
	</button>
</div>

<style>
	.channel-card {
		position: relative;
		display: flex;
		flex-direction: column;
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		overflow: hidden;
		cursor: pointer;
		transition: border-color 0.15s, background-color 0.15s;
		outline: none;
	}

	.channel-card:hover,
	.channel-card:focus-visible {
		background-color: var(--color-surface-raised);
		border-color: oklch(0.28 0 0);
	}

	.channel-card.watching {
		border-color: var(--color-text-muted);
		background-color: var(--color-surface-raised);
	}

	.logo-wrap {
		width: 100%;
		aspect-ratio: 16 / 9;
		background-color: oklch(0.12 0 0);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.logo-wrap img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		padding: 12px;
	}

	.meta {
		display: flex;
		flex-direction: column;
		padding: 10px 10px 10px;
		gap: 3px;
		flex: 1;
	}

	.name {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.3;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.flag {
		font-size: 14px;
		line-height: 1;
	}

	.stream-count {
		font-size: 11px;
		color: var(--color-text-dim);
	}

	.fav-btn {
		position: absolute;
		top: 6px;
		right: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border: none;
		background: rgba(0, 0, 0, 0.5);
		color: var(--color-text-muted);
		cursor: pointer;
		transition: color 0.15s, background 0.15s;
		padding: 0;
	}

	.fav-btn:hover {
		color: var(--color-text);
		background: rgba(0, 0, 0, 0.75);
	}

	.fav-btn.active {
		color: var(--color-live);
	}
</style>
