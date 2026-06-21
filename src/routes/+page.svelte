<script lang="ts">
import type { Component } from 'svelte';
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import ChannelGrid from '$lib/components/ChannelGrid.svelte';
import EmptyState from '$lib/components/EmptyState.svelte';
import FilterBar from '$lib/components/FilterBar.svelte';
import HomeView from '$lib/components/HomeView.svelte';
import type SearchBar from '$lib/components/SearchBar.svelte';
import { catalog } from '$lib/state/catalog.svelte';
import { library } from '$lib/state/library.svelte';
import { player } from '$lib/state/player.svelte.js';
import type { Channel } from '$lib/types.js';
import type { PageData } from './$types.js';

let { data }: { data: PageData } = $props();

let searchEl: SearchBar;
let notFound = $state(false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let OverlayComponent = $state<Component<any> | null>(null);

// Lazy-load PlayerOverlay only when first needed
$effect(() => {
	if (player.current && !OverlayComponent) {
		import('$lib/components/PlayerOverlay.svelte').then((m) => {
			OverlayComponent = m.default as Component<any>;
		});
	}
});

const watchId = $derived($page.url.searchParams.get('watch'));

// Sync URL → player state
$effect(() => {
	const id = watchId;
	if (!id) {
		player.close();
		notFound = false;
		return;
	}
	if (player.current?.id === id) return;

	const inCatalog = catalog.channels.find((c) => c.id === id);
	if (inCatalog) {
		player.open(inCatalog, catalog.channels, 'catalog');
		return;
	}

	notFound = false;
	fetch(`/api/channels?watch=${encodeURIComponent(id)}`)
		.then((r) => (r.ok ? r.json() : null))
		.then((d: { channel: Channel | null } | null) => {
			if (d?.channel) {
				player.openSingle(d.channel, 'deeplink');
			} else {
				notFound = true;
			}
		})
		.catch(() => {
			notFound = true;
		});
});

onMount(() => {
	library.init();
	catalog.loadFilters();
	catalog.search(true);

	const handleKey = (e: KeyboardEvent) => {
		if (
			e.key === '/' &&
			!watchId &&
			document.activeElement?.tagName !== 'INPUT'
		) {
			e.preventDefault();
			searchEl?.focus();
		}
	};
	window.addEventListener('keydown', handleKey);
	return () => window.removeEventListener('keydown', handleKey);
});

function onSearchChange(q: string) {
	catalog.filters.q = q;
	catalog.search(true);
}

function onFilterChange(f: {
	country: string;
	category: string;
	language: string;
}) {
	catalog.filters.country = f.country;
	catalog.filters.category = f.category;
	catalog.filters.language = f.language;
	catalog.search(true);
}

function openPlayer(
	channel: Channel,
	queue: Channel[] = [],
	source:
		| 'catalog'
		| 'row'
		| 'favorites'
		| 'recents'
		| 'search'
		| 'deeplink' = 'catalog',
) {
	library.addRecent(channel);
	if (queue && queue.length > 0 && source !== 'catalog') {
		player.open(channel, queue, source);
	} else {
		player.open(channel, catalog.channels, 'catalog');
	}
	const u = new URL(window.location.href);
	u.searchParams.set('watch', channel.id);
	goto(u.toString(), { replaceState: false, noScroll: true });
}

function closePlayer() {
	player.close();
	notFound = false;
	const u = new URL(window.location.href);
	u.searchParams.delete('watch');
	goto(u.toString(), { replaceState: true, noScroll: true });
}

function zapNext() {
	const next = player.next();
	if (next) {
		library.addRecent(next);
		const u = new URL(window.location.href);
		u.searchParams.set('watch', next.id);
		goto(u.toString(), { replaceState: false, noScroll: true });
	}
}

function zapPrev() {
	const prev = player.prev();
	if (prev) {
		library.addRecent(prev);
		const u = new URL(window.location.href);
		u.searchParams.set('watch', prev.id);
		goto(u.toString(), { replaceState: false, noScroll: true });
	}
}
</script>

<div class="bg-mesh min-h-screen">
	<!-- Header -->
	<header class="glass-header sticky top-0 z-30 px-4 py-3">
		<div class="mx-auto max-w-7xl space-y-2">
			<div class="flex items-center gap-4">
				<a
					href="/"
					class="font-black tracking-tight text-[var(--color-text)] no-underline"
					style="font-size: clamp(1.4rem, 4vw, 2rem); letter-spacing: -0.04em;"
				>
					dtv
				</a>
				<div class="flex-1">
					<SearchBar bind:this={searchEl} value={catalog.filters.q} onchange={onSearchChange} />
				</div>
			</div>
			<FilterBar
				filters={{ country: catalog.filters.country, category: catalog.filters.category, language: catalog.filters.language }}
				options={catalog.filterOptions}
				onchange={onFilterChange}
			/>
		</div>
	</header>

	<!-- Favorites row -->
	{#if library.favorites.size > 0}
		<section class="mx-auto max-w-7xl px-4 pt-6">
			<h2
				class="mb-3 text-xs font-semibold uppercase tracking-widest"
				style="color: var(--color-text-dim);"
			>
				Favorites
			</h2>
			<div class="flex gap-3 overflow-x-auto pb-2">
				{#each [...library.favorites] as id}
					{@const ch = catalog.channels.find((c) => c.id === id)}
					{#if ch}
						<button
							onclick={() => openPlayer(ch)}
							class="flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:border-[var(--color-text-muted)]"
							style="border-color: var(--color-border); color: var(--color-text-muted);"
						>
							{ch.countryFlag}
							{ch.name}
						</button>
					{/if}
				{/each}
			</div>
		</section>
	{/if}

	<!-- Recents row -->
	{#if library.recents.length > 0}
		<section class="mx-auto max-w-7xl px-4 pt-5">
			<h2
				class="mb-3 text-xs font-semibold uppercase tracking-widest"
				style="color: var(--color-text-dim);"
			>
				Recently watched
			</h2>
			<div class="flex gap-3 overflow-x-auto pb-2">
				{#each library.recents.slice(0, 10) as ch}
					<button
						onclick={() => openPlayer(ch)}
						class="flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:border-[var(--color-text-muted)]"
						style="border-color: var(--color-border); color: var(--color-text-muted);"
					>
						{ch.countryFlag}
						{ch.name}
					</button>
				{/each}
			</div>
		</section>
	{/if}

	<!-- HomeView (hidden when any filter/search is active) -->
	{#if !catalog.filters.q && !catalog.filters.country && !catalog.filters.category && !catalog.filters.language}
		{#if data?.home}
			<HomeView
				home={data.home}
				favorites={library.favorites}
				onplay={(ch, queue) => openPlayer(ch, queue, 'row')}
				onfavorite={(id) => library.toggleFavorite(id)}
				onseeall={(categoryId) => {
					catalog.filters.category = categoryId;
					catalog.search(true);
				}}
			/>
		{/if}
	{/if}

	<!-- Channel grid -->
	<main class="mx-auto max-w-7xl px-4 py-6">
		{#if catalog.error}
			<div style="display:flex; align-items:center; gap:12px; padding:16px; border:1px solid var(--color-border); border-radius:8px; margin-bottom:16px; background:var(--color-surface);">
				<p style="flex:1; color:var(--color-text-muted); font-size:14px; margin:0;">{catalog.error}</p>
				<button
					onclick={() => catalog.search(true)}
					style="padding: 6px 16px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-surface-raised); color: var(--color-text); font-family: var(--font-sans); font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;"
				>Retry</button>
			</div>
		{/if}
		{#if catalog.channels.length === 0 && !catalog.loading}
			<EmptyState
				message="No channels found"
				sub={catalog.filters.q || catalog.filters.country || catalog.filters.category
					? 'Try adjusting your search or filters'
					: null}
			/>
		{:else}
			<p class="mb-4 text-xs" style="color: var(--color-text-dim);">
				{catalog.total.toLocaleString()} channels
			</p>
			<ChannelGrid
				channels={catalog.channels}
				watchingId={watchId}
				onplay={openPlayer}
				onloadmore={() => catalog.loadMore()}
				loading={catalog.loading}
				hasMore={catalog.hasMore}
				favorites={library.favorites}
				onfavorite={(id) => library.toggleFavorite(id)}
			/>
		{/if}
	</main>
</div>

{#if player.current && OverlayComponent}
	<OverlayComponent
		channel={player.current}
		onclose={closePlayer}
		onnext={zapNext}
		onprev={zapPrev}
		onfavorite={(id: string) => library.toggleFavorite(id)}
		isFavorite={library.isFavorite(player.current.id)}
		hasNext={player.hasNext}
		hasPrev={player.hasPrev}
	/>
{:else if notFound}
	<div
		class="glass-overlay fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
		role="alertdialog"
		aria-label="Channel not found"
	>
		<p style="font-size: 1.25rem; font-weight: 900; color: var(--color-text); letter-spacing: -0.02em;">Channel not found</p>
		<button
			onclick={closePlayer}
			style="padding: 8px 20px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); font-family: var(--font-sans); font-size: 13px; font-weight: 600; cursor: pointer;"
		>
			Back to home
		</button>
	</div>
{:else if watchId && !catalog.loading && !player.current}
	<div
		class="glass-overlay fixed inset-0 z-50 flex items-center justify-center"
		role="status"
		aria-label="Loading channel"
	>
		<p style="color: var(--color-text-muted);">Loading…</p>
	</div>
{/if}
