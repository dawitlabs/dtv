<script lang="ts">
	import type { Channel } from '$lib/types.js';
	import ChannelCard from './ChannelCard.svelte';

	import type { Snippet } from 'svelte';

	type Props = {
		channels: Channel[];
		watchingId: string | null;
		onplay: (channel: Channel) => void;
		onloadmore: () => void;
		loading: boolean;
		hasMore: boolean;
		favorites: Set<string>;
		onfavorite: (id: string) => void;
		empty?: Snippet;
	};

	let { channels, watchingId, onplay, onloadmore, loading, hasMore, favorites, onfavorite, empty }: Props = $props();

	let sentinel: HTMLDivElement = $state(null as unknown as HTMLDivElement);

	$effect(() => {
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !loading) {
					onloadmore();
				}
			},
			{ rootMargin: '200px' }
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	});
</script>

<div class="grid-wrap">
	{#if channels.length === 0 && !loading}
		{@render empty?.()}
	{:else}
		<div class="channel-grid">
			{#each channels as channel (channel.id)}
				<ChannelCard
					{channel}
					watching={watchingId === channel.id}
					isFavorite={favorites.has(channel.id)}
					onclick={() => onplay(channel)}
					onfavorite={() => onfavorite(channel.id)}
				/>
			{/each}

			{#if loading}
				{#each { length: 12 } as _}
					<div class="skeleton-card">
						<div class="skeleton-logo"></div>
						<div class="skeleton-meta">
							<div class="skeleton-line" style="width:70%;"></div>
							<div class="skeleton-line" style="width:45%;margin-top:6px;"></div>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		{#if hasMore}
			<div bind:this={sentinel} class="sentinel" aria-hidden="true"></div>
		{/if}
	{/if}
</div>

<style>
	.grid-wrap {
		width: 100%;
	}

	.channel-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 12px;
	}

	.skeleton-card {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		overflow: hidden;
	}

	.skeleton-logo {
		width: 100%;
		aspect-ratio: 16 / 9;
		background: linear-gradient(
			90deg,
			oklch(0.12 0 0) 25%,
			oklch(0.15 0 0) 50%,
			oklch(0.12 0 0) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.4s infinite;
	}

	.skeleton-meta {
		padding: 10px;
	}

	.skeleton-line {
		height: 10px;
		border-radius: 4px;
		background: linear-gradient(
			90deg,
			oklch(0.14 0 0) 25%,
			oklch(0.18 0 0) 50%,
			oklch(0.14 0 0) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.4s infinite;
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	.sentinel {
		height: 1px;
		margin-top: 8px;
	}

	@media (prefers-reduced-motion: reduce) {
		.skeleton-logo,
		.skeleton-line {
			animation: none;
		}
	}
</style>
