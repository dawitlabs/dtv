<script lang="ts">
type Props = {
	value: string;
	onchange: (v: string) => void;
	autofocus?: boolean;
};

let { value, onchange, autofocus = false }: Props = $props();

let inputEl: HTMLInputElement;

export function focus() {
	inputEl?.focus();
}

$effect(() => {
	if (autofocus && inputEl) {
		inputEl.focus();
	}
});
</script>

<div class="search-wrap">
	<svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
		<circle cx="11" cy="11" r="8"/>
		<line x1="21" y1="21" x2="16.65" y2="16.65"/>
	</svg>

	<input
		bind:this={inputEl}
		type="search"
		class="search-input"
		placeholder="Search channels..."
		{value}
		oninput={(e) => onchange((e.currentTarget as HTMLInputElement).value)}
		autocomplete="off"
		spellcheck={false}
	/>

	{#if value}
		<button
			class="clear-btn"
			aria-label="Clear search"
			onclick={() => onchange('')}
			tabindex="0"
		>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
				<line x1="18" y1="6" x2="6" y2="18"/>
				<line x1="6" y1="6" x2="18" y2="18"/>
			</svg>
		</button>
	{/if}
</div>

<style>
	.search-wrap {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
	}

	.search-icon {
		position: absolute;
		left: 14px;
		color: var(--color-text-dim);
		pointer-events: none;
		flex-shrink: 0;
	}

	.search-input {
		width: 100%;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		color: var(--color-text);
		font-family: var(--font-sans);
		font-size: 15px;
		padding: 10px 40px 10px 42px;
		outline: none;
		transition: border-color 0.15s;
		-webkit-appearance: none;
		appearance: none;
	}

	.search-input::placeholder {
		color: var(--color-text-dim);
	}

	.search-input:focus {
		border-color: oklch(0.35 0 0);
	}

	.search-input::-webkit-search-cancel-button {
		display: none;
	}

	.clear-btn {
		position: absolute;
		right: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: none;
		background: oklch(0.22 0 0);
		color: var(--color-text-muted);
		cursor: pointer;
		padding: 0;
		transition: background 0.15s, color 0.15s;
	}

	.clear-btn:hover {
		background: oklch(0.28 0 0);
		color: var(--color-text);
	}
</style>
