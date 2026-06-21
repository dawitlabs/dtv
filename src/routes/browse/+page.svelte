<script lang="ts">
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import type { FilterOptions } from '$lib/types.js';

let options = $state<FilterOptions | null>(null);

onMount(async () => {
	const res = await fetch('/api/filters');
	options = await res.json() as FilterOptions;
});

function goCategory(id: string) {
	goto(`/?category=${encodeURIComponent(id)}`);
}

function goCountry(code: string) {
	goto(`/?country=${encodeURIComponent(code)}`);
}
</script>

<div class="bg-mesh" style="min-height: 100vh;">
	<header class="glass-header sticky top-0 z-30" style="padding: 12px 16px;">
		<div style="max-width: 960px; margin: 0 auto; display: flex; align-items: center; gap: 16px;">
			<a
				href="/"
				style="color: var(--color-text-muted); text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; transition: color 0.15s;"
				onmouseenter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
				onmouseleave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
			>
				← dtv
			</a>
			<h1 style="margin: 0; font-size: clamp(1.1rem, 3vw, 1.4rem); font-weight: 900; letter-spacing: -0.03em; color: var(--color-text);">
				Browse
			</h1>
		</div>
	</header>

	<main style="max-width: 960px; margin: 0 auto; padding: 40px 16px 80px;">
		<div style="display: flex; gap: 48px; flex-wrap: wrap; align-items: flex-start;">

			<!-- Categories -->
			<div style="flex: 1; min-width: 280px;">
				<h2 style="margin: 0 0 16px; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-text-dim);">
					Categories
				</h2>

				{#if options === null}
					<div style="display: flex; flex-wrap: wrap; gap: 8px;">
						{#each Array(12) as _}
							<div
								class="chip-skeleton"
								style="height: 36px; width: {Math.floor(Math.random() * 60 + 60)}px; border-radius: 6px; background: var(--color-surface-raised); animation: pulse 1.4s ease-in-out infinite;"
							></div>
						{/each}
					</div>
				{:else}
					<div style="display: flex; flex-wrap: wrap; gap: 8px;">
						{#each options.categories as cat (cat.id)}
							<button
								onclick={() => goCategory(cat.id)}
								style="padding: 7px 14px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-muted); font-family: var(--font-sans); font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: border-color 0.15s, color 0.15s, background 0.15s;"
								onmouseenter={(e) => { e.currentTarget.style.borderColor = 'var(--color-text-muted)'; e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.background = 'var(--color-surface-raised)'; }}
								onmouseleave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'var(--color-surface)'; }}
							>
								{cat.name}
								<span style="font-size: 11px; color: var(--color-text-dim); font-weight: 500;">{cat.count.toLocaleString()}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Countries -->
			<div style="flex: 1; min-width: 280px;">
				<h2 style="margin: 0 0 16px; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-text-dim);">
					Countries
				</h2>

				{#if options === null}
					<div style="display: flex; flex-wrap: wrap; gap: 8px;">
						{#each Array(12) as _}
							<div
								class="chip-skeleton"
								style="height: 36px; width: {Math.floor(Math.random() * 60 + 70)}px; border-radius: 6px; background: var(--color-surface-raised); animation: pulse 1.4s ease-in-out infinite;"
							></div>
						{/each}
					</div>
				{:else}
					<div style="display: flex; flex-wrap: wrap; gap: 8px;">
						{#each options.countries as c (c.code)}
							<button
								onclick={() => goCountry(c.code)}
								style="padding: 7px 14px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-muted); font-family: var(--font-sans); font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: border-color 0.15s, color 0.15s, background 0.15s;"
								onmouseenter={(e) => { e.currentTarget.style.borderColor = 'var(--color-text-muted)'; e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.background = 'var(--color-surface-raised)'; }}
								onmouseleave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'var(--color-surface)'; }}
							>
								<span>{c.flag}</span>
								{c.name}
								<span style="font-size: 11px; color: var(--color-text-dim); font-weight: 500;">{c.count.toLocaleString()}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>

		</div>
	</main>
</div>
