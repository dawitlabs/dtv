import type { CatalogFilters, Channel, FilterOptions } from '$lib/types.js';

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

	async loadMore(): Promise<void> {
		if (!this.hasMore || this.loading) return;
		this.page++;
		await this.search(false);
	}
}

export const catalog = new CatalogState();
