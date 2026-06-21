<script lang="ts">
import type { FilterOptions } from '$lib/types.js';

type Filters = {
	country: string;
	category: string;
	language: string;
};

type Props = {
	filters: Filters;
	options: FilterOptions | null;
	onchange: (filters: Filters) => void;
};

let { filters, options, onchange }: Props = $props();

function setCategory(id: string) {
	onchange({ ...filters, category: id });
}

function setCountry(e: Event) {
	onchange({
		...filters,
		country: (e.currentTarget as HTMLSelectElement).value,
	});
}

function setLanguage(e: Event) {
	onchange({
		...filters,
		language: (e.currentTarget as HTMLSelectElement).value,
	});
}
</script>

<div class="filter-bar">
	<div class="category-strip" role="group" aria-label="Filter by category">
		{#if options === null}
			{#each { length: 5 } as _}
				<div class="chip-skeleton"></div>
			{/each}
		{:else}
			<button
				class="chip"
				class:active={!filters.category}
				onclick={() => setCategory('')}
			>
				All
			</button>
			{#each options.categories as cat (cat.id)}
				<button
					class="chip"
					class:active={filters.category === cat.id}
					onclick={() => setCategory(cat.id)}
				>
					{cat.name}
					<span class="chip-count">{cat.count}</span>
				</button>
			{/each}
		{/if}
	</div>

	<div class="selects-row">
		<div class="select-wrap">
			<select
				class="filter-select"
				value={filters.country}
				onchange={setCountry}
				disabled={options === null}
				aria-label="Filter by country"
			>
				<option value="">All countries</option>
				{#if options}
					{#each options.countries as c (c.code)}
						<option value={c.code}>{c.flag} {c.name} ({c.count})</option>
					{/each}
				{/if}
			</select>
			<svg class="select-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
				<polyline points="6 9 12 15 18 9"/>
			</svg>
		</div>

		<div class="select-wrap">
			<select
				class="filter-select"
				value={filters.language}
				onchange={setLanguage}
				disabled={options === null}
				aria-label="Filter by language"
			>
				<option value="">All languages</option>
				{#if options}
					{#each options.languages as l (l.code)}
						<option value={l.code}>{l.name} ({l.count})</option>
					{/each}
				{/if}
			</select>
			<svg class="select-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
				<polyline points="6 9 12 15 18 9"/>
			</svg>
		</div>
	</div>
</div>

<style>
	.filter-bar {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.category-strip {
		display: flex;
		gap: 6px;
		overflow-x: auto;
		padding-bottom: 2px;
		scrollbar-width: none;
	}

	.category-strip::-webkit-scrollbar {
		display: none;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		flex-shrink: 0;
		padding: 5px 12px;
		border-radius: 9999px;
		border: 1px solid var(--color-border);
		background: transparent;
		color: var(--color-text-muted);
		font-family: var(--font-sans);
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.02em;
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s, background 0.15s;
		white-space: nowrap;
	}

	.chip:hover {
		color: var(--color-text);
		border-color: oklch(0.30 0 0);
	}

	.chip.active {
		color: var(--color-text);
		border-color: oklch(0.50 0 0);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		background-color: rgba(255, 255, 255, 0.10);
		box-shadow:
			inset 1px 1px 1px 0px rgba(255, 255, 255, 0.12),
			inset -1px -1px 1px 0px rgba(255, 255, 255, 0.06);
	}

	.chip-count {
		color: var(--color-text-dim);
		font-size: 10px;
		font-weight: 400;
	}

	.chip-skeleton {
		flex-shrink: 0;
		width: 72px;
		height: 28px;
		border-radius: 9999px;
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

	.selects-row {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.select-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}

	.filter-select {
		appearance: none;
		-webkit-appearance: none;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		color: var(--color-text-muted);
		font-family: var(--font-sans);
		font-size: 12px;
		padding: 6px 30px 6px 10px;
		cursor: pointer;
		outline: none;
		transition: border-color 0.15s, color 0.15s;
	}

	.filter-select:focus {
		border-color: oklch(0.35 0 0);
		color: var(--color-text);
	}

	.filter-select:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.select-chevron {
		position: absolute;
		right: 8px;
		color: var(--color-text-dim);
		pointer-events: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.chip-skeleton {
			animation: none;
		}
	}
</style>
