<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { catalog } from '$lib/state/catalog.svelte';
	import { library } from '$lib/state/library.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import ChannelGrid from '$lib/components/ChannelGrid.svelte';
	import PlayerOverlay from '$lib/components/PlayerOverlay.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import type { Channel } from '$lib/types';

	let searchEl: SearchBar;
	let debounceTimer: ReturnType<typeof setTimeout>;

	const watchId = $derived($page.url.searchParams.get('watch'));
	const watchingChannel = $derived(
		watchId ? catalog.channels.find((c) => c.id === watchId) ?? null : null
	);

	onMount(() => {
		library.init();
		catalog.loadFilters();
		catalog.search(true);

		const handleKey = (e: KeyboardEvent) => {
			if (e.key === '/' && !watchId && document.activeElement?.tagName !== 'INPUT') {
				e.preventDefault();
				searchEl?.focus();
			}
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	});

	function onSearchChange(q: string) {
		clearTimeout(debounceTimer);
		catalog.filters.q = q;
		debounceTimer = setTimeout(() => catalog.search(true), 200);
	}

	function onFilterChange(f: { country: string; category: string; language: string }) {
		catalog.filters.country = f.country;
		catalog.filters.category = f.category;
		catalog.filters.language = f.language;
		catalog.search(true);
	}

	function openPlayer(channel: Channel) {
		library.addRecent(channel);
		const u = new URL(window.location.href);
		u.searchParams.set('watch', channel.id);
		goto(u.toString(), { replaceState: false, noScroll: true });
	}

	function closePlayer() {
		const u = new URL(window.location.href);
		u.searchParams.delete('watch');
		goto(u.toString(), { replaceState: true, noScroll: true });
	}

	function zapNext() {
		if (!watchId) return;
		const idx = catalog.channels.findIndex((c) => c.id === watchId);
		const next = catalog.channels[idx + 1];
		if (next) openPlayer(next);
	}

	function zapPrev() {
		if (!watchId) return;
		const idx = catalog.channels.findIndex((c) => c.id === watchId);
		const prev = catalog.channels[idx - 1];
		if (prev) openPlayer(prev);
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

	<!-- Channel grid -->
	<main class="mx-auto max-w-7xl px-4 py-6">
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

<!-- Player overlay (portal-like, rendered at root) -->
{#if watchingChannel}
	<PlayerOverlay
		channel={watchingChannel}
		onclose={closePlayer}
		onnext={zapNext}
		onprev={zapPrev}
		onfavorite={(id) => library.toggleFavorite(id)}
		isFavorite={library.isFavorite(watchingChannel.id)}
	/>
{:else if watchId && !catalog.loading}
	<!-- watchId in URL but not found yet — wait for catalog, then close if still missing -->
	<div
		class="glass-overlay fixed inset-0 z-50 flex items-center justify-center"
		role="status"
		aria-label="Loading channel"
	>
		<p style="color: var(--color-text-muted);">Loading…</p>
	</div>
{/if}
