<script lang="ts">
import { createWindowVirtualizer } from '@tanstack/svelte-virtual';
import type { Snippet } from 'svelte';
import { untrack } from 'svelte';
import type { Channel } from '$lib/types.js';
import ChannelCard from './ChannelCard.svelte';

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

let {
	channels,
	watchingId,
	onplay,
	onloadmore,
	loading,
	hasMore,
	favorites,
	onfavorite,
	empty,
}: Props = $props();

let gridEl: HTMLDivElement | null = $state(null);
let containerWidth = $state(0);

const cols = $derived(Math.max(1, Math.floor((containerWidth + 12) / 172)));
const rowCount = $derived(Math.ceil(channels.length / cols));
const cardWidth = $derived(
	Math.floor((containerWidth - 12 * (cols - 1)) / cols),
);
const rowHeight = $derived(Math.floor((cardWidth * 9) / 16) + 64);

const virtualizer = createWindowVirtualizer({
	count: 0,
	estimateSize: () => 200,
	overscan: 3,
});

// Sync virtualizer options when count or rowHeight changes.
// untrack around setOptions breaks the cycle: setOptions notifies the
// virtualizer store, which would re-trigger this effect without untrack.
$effect(() => {
	if (!gridEl) return;

	const currentRowCount = rowCount;
	const currentRowHeight = rowHeight;
	const scrollMargin = gridEl.offsetTop;

	untrack(() => {
		$virtualizer.setOptions({
			count: currentRowCount,
			estimateSize: () => currentRowHeight,
			scrollMargin,
		});
	});
});

// ResizeObserver to track container width
$effect(() => {
	if (!gridEl) return;

	const ro = new ResizeObserver((entries) => {
		const w = entries[0]?.contentRect.width ?? 0;
		containerWidth = w;
	});
	ro.observe(gridEl);
	return () => ro.disconnect();
});

// Load more when near the end
$effect(() => {
	const items = $virtualizer.getVirtualItems();
	if (items.length === 0) return;

	const lastItem = items[items.length - 1];
	if (lastItem.index >= rowCount - 3 && hasMore && !loading) {
		onloadmore();
	}
});
</script>

{#if channels.length === 0 && !loading}
	{@render empty?.()}
{:else if loading && channels.length === 0}
	<!-- Initial load skeleton -->
	<div class="skeleton-grid">
		{#each { length: 12 } as _}
			<div class="skeleton-card">
				<div class="skeleton-logo"></div>
				<div class="skeleton-meta">
					<div class="skeleton-line" style="width:70%;"></div>
					<div class="skeleton-line" style="width:45%;margin-top:6px;"></div>
				</div>
			</div>
		{/each}
	</div>
{:else}
	<div
		bind:this={gridEl}
		style="position: relative; height: {$virtualizer.getTotalSize()}px;"
	>
		{#each $virtualizer.getVirtualItems() as vrow (vrow.key)}
			<div
				style="position: absolute; top: 0; left: 0; width: 100%;
				       transform: translateY({vrow.start - ($virtualizer.options.scrollMargin ?? 0)}px);
				       display: grid; grid-template-columns: repeat({cols}, 1fr); gap: 12px;"
			>
				{#each channels.slice(vrow.index * cols, vrow.index * cols + cols) as channel (channel.id)}
					<ChannelCard
						{channel}
						watching={watchingId === channel.id}
						isFavorite={favorites.has(channel.id)}
						onclick={() => onplay(channel)}
						onfavorite={() => onfavorite(channel.id)}
					/>
				{/each}
			</div>
		{/each}
	</div>

	{#if loading && channels.length > 0}
		<div style="padding: 24px; display: flex; justify-content: center;">
			<div class="skeleton-line" style="width: 120px; height: 10px; border-radius: 4px;"></div>
		</div>
	{/if}
{/if}

<style>
	.skeleton-grid {
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

	@media (prefers-reduced-motion: reduce) {
		.skeleton-logo,
		.skeleton-line {
			animation: none;
		}
	}
</style>
