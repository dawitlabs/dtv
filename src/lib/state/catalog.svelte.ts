import type { CatalogFilters, Channel, FilterOptions } from '$lib/types.js';
import { playlists } from './playlists.svelte.js';

class CatalogState {
	filters = $state<CatalogFilters>({
		q: '',
		country: '',
		category: '',
		language: '',
	});
	channels = $state<Channel[]>([]);
	total = $state(0);
	page = $state(0);
	loading = $state(false);
	error = $state<string | null>(null);
	filterOptions = $state<FilterOptions | null>(null);

	hasMore = $derived(this.channels.length < this.total);

	private abortController: AbortController | null = null;
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;

	async loadFilters(): Promise<void> {
		const res = await fetch('/api/filters');
		if (!res.ok) return;
		this.filterOptions = (await res.json()) as FilterOptions;
		if (playlists.allChannels.length > 0) {
			this.filterOptions = {
				...this.filterOptions,
				categories: [
					{ id: 'custom', name: 'My channels', count: playlists.allChannels.length },
					...this.filterOptions.categories,
				],
			};
		}
	}

	constructor() {
		$effect(() => {
			playlists.items.length; // track
			if (this.filterOptions) this.loadFilters();
		});
	}

	async search(reset = false): Promise<void> {
		if (this.debounceTimer !== null) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}

		const run = async () => {
			this.abortController?.abort();
			this.abortController = new AbortController();

			if (reset) {
				this.channels = [];
				this.page = 0;
			}

			this.loading = true;
			this.error = null;

			const params = new URLSearchParams();
			if (this.filters.q) params.set('q', this.filters.q);
			if (this.filters.country) params.set('country', this.filters.country);
			if (this.filters.category) params.set('category', this.filters.category);
			if (this.filters.language) params.set('language', this.filters.language);
			params.set('page', String(this.page));

			try {
				const res = await fetch(`/api/channels?${params}`, {
					signal: this.abortController.signal,
				});

				if (!res.ok) throw new Error(`HTTP ${res.status}`);

				const data = (await res.json()) as {
					channels: Channel[];
					total: number;
					page: number;
				};

				if (reset) {
					this.channels = data.channels;
				} else {
					this.channels = [...this.channels, ...data.channels];
				}
				this.total = data.total;
				this.mergeCustom();
			} catch (err) {
				if (err instanceof DOMException && err.name === 'AbortError') return;
				this.error =
					err instanceof Error ? err.message : 'Failed to load channels';
			} finally {
				this.loading = false;
			}
		};

		if (reset && this.filters.q) {
			this.debounceTimer = setTimeout(() => {
				this.debounceTimer = null;
				run();
			}, 200);
		} else {
			await run();
		}
	}

	private mergeCustom(): void {
		if (playlists.items.length === 0) return;
		const f = this.filters;
		let custom = playlists.allChannels;
		if (f.q) {
			const q = f.q.toLowerCase();
			custom = custom.filter(c => c.name.toLowerCase().includes(q));
		}
		if (f.category && f.category !== 'custom') custom = custom.filter(c => c.categories.includes(f.category));
		if (f.country) custom = custom.filter(c => c.country === f.country);
		if (f.language) custom = custom.filter(c => c.languages.includes(f.language));
		const existingIds = new Set(this.channels.map(c => c.id));
		const fresh = custom.filter(c => !existingIds.has(c.id));
		if (fresh.length > 0) {
			this.channels = [...fresh, ...this.channels];
			this.total = this.total + fresh.length;
		}
	}

	async loadMore(): Promise<void> {
		if (!this.hasMore || this.loading) return;
		this.page++;
		await this.search(false);
	}
}

export const catalog = new CatalogState();
