<script lang="ts">
import type { Channel } from '$lib/types.js';

type Props = {
	title: string;
	channels: Channel[];
	favorites: Set<string>;
	onplay: (channel: Channel, queue: Channel[]) => void;
	onfavorite: (id: string) => void;
	onseeall?: () => void;
};

let { title, channels, favorites, onplay, onfavorite, onseeall }: Props =
	$props();

function cardData(ch: Channel) {
	return {
		isFav: favorites.has(ch.id),
		initials: ch.name
			.split(/\s+/)
			.slice(0, 2)
			.map((w) => w[0])
			.join('')
			.toUpperCase(),
	};
}
</script>

<section class="category-row-section">
	<div class="section-head">
		<span class="section-label">{title}</span>
		{#if onseeall}
			<button class="see-all" onclick={onseeall}>
				See all
				<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<polyline points="9 18 15 12 9 6" />
				</svg>
			</button>
		{/if}
	</div>

	{#snippet channelCard(ch: Channel)}
		{@const { isFav, initials } = cardData(ch)}
		<div
			class="sport-card"
			class:fav={isFav}
			role="button"
			tabindex="0"
			onclick={() => onplay(ch, channels)}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onplay(ch, channels);
				}
			}}
			aria-label="Watch {ch.name}"
		>
			<div class="card-logo">
				{#if ch.logo}
					<img
						src={ch.logo}
						alt={ch.name}
						loading="lazy"
						onerror={(e) => {
							(e.currentTarget as HTMLImageElement).style.display = 'none';
						}}
					/>
				{/if}
				<span class="card-initials">{initials}</span>
			</div>
			<div class="card-meta">
				<span class="card-name">{ch.name}</span>
				<span class="card-flag">{ch.countryFlag}</span>
			</div>
			<button
				class="card-fav"
				aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
				onclick={(e) => {
					e.stopPropagation();
					onfavorite(ch.id);
				}}
			>
				<svg
					width="11"
					height="11"
					viewBox="0 0 24 24"
					fill={isFav ? 'currentColor' : 'none'}
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
					/>
				</svg>
			</button>
		</div>
	{/snippet}

	<div class="row" role="list">
		{#each channels.slice(0, 20) as ch (ch.id)}
			<div role="listitem">{@render channelCard(ch)}</div>
		{/each}
	</div>
</section>

<style>
	.category-row-section {
		padding: 24px 16px 8px;
	}

	.section-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 12px;
	}

	.section-label {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-text-dim);
	}

	.see-all {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		transition: color 0.15s;
		font-family: var(--font-sans);
	}

	.see-all:hover {
		color: var(--color-text);
	}

	.row {
		display: flex;
		gap: 10px;
		overflow-x: auto;
		padding-bottom: 4px;
		scrollbar-width: none;
	}

	.row::-webkit-scrollbar {
		display: none;
	}

	.sport-card {
		position: relative;
		display: flex;
		flex-direction: column;
		width: 120px;
		flex-shrink: 0;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		overflow: hidden;
		cursor: pointer;
		transition: border-color 0.15s, background 0.15s;
		-webkit-tap-highlight-color: transparent;
		outline: none;
	}

	.sport-card:hover,
	.sport-card:focus-visible {
		background: var(--color-surface-raised);
		border-color: oklch(0.28 0 0);
	}

	.sport-card.fav {
		border-color: oklch(0.30 0 0);
	}

	.card-logo {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		background: oklch(0.12 0 0);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.card-logo img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		padding: 8px;
	}

	.card-initials {
		font-size: 15px;
		font-weight: 900;
		letter-spacing: -0.03em;
		color: oklch(0.35 0 0);
	}

	.card-meta {
		padding: 6px 8px 7px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 4px;
	}

	.card-name {
		font-size: 11px;
		font-weight: 600;
		color: var(--color-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex: 1;
		line-height: 1.3;
	}

	.card-flag {
		font-size: 12px;
		flex-shrink: 0;
	}

	.card-fav {
		position: absolute;
		top: 4px;
		right: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		border: none;
		background: rgba(0, 0, 0, 0.55);
		color: var(--color-text-muted);
		cursor: pointer;
		padding: 0;
		transition: color 0.15s;
	}

	.card-fav:hover {
		color: var(--color-text);
	}
</style>
